import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { TaskLibraryService } from '../../workflow/task-library/task-library.service';
import { PriceBreakdown } from './types/price-breakdown';
import { roundMoney, computeTaxBreakdown } from '../../finance/shared/pricing.utils';

/** Re-export for consumers that imported from here. */
export { PriceBreakdown } from './types/price-breakdown';

/** Operator shape common to both template and instance queries. */
interface OperatorWithEquipment {
  hours: unknown;
  equipment: Array<{
    equipment_id: number;
    equipment: {
      id: number;
      item_name: string;
      category: string | null;
      rental_price_per_day: unknown;
    };
  }>;
}

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskLibraryService: TaskLibraryService,
  ) {}

  private static readonly PRICING_EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

  // ─── Public API ───────────────────────────────────────────────────────

  async estimatePackagePrice(
    packageId: number,
    brandId: number,
    userId: number,
  ): Promise<PriceBreakdown> {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      include: {
        package_crew_slots: {
          include: { equipment: { include: { equipment: { select: this.equipmentSelect } } } },
        },
      },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    return this.buildBreakdown(
      pkg.id,
      pkg.name,
      brandId,
      pkg.package_crew_slots,
      packageId,
      userId,
    );
  }

  async estimateInquiryPrice(
    inquiryId: number,
    brandId: number,
    userId: number,
  ): Promise<PriceBreakdown> {
    const inquiry = await this.prisma.inquiries.findFirst({
      where: { id: inquiryId },
      select: { id: true, selected_package_id: true },
    });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    if (!inquiry.selected_package_id) throw new NotFoundException('Inquiry has no selected package');

    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: inquiry.selected_package_id, brand_id: brandId },
      select: { id: true, name: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const instanceOps = await this.prisma.projectCrewSlot.findMany({
      where: { inquiry_id: inquiryId },
      include: { equipment: { include: { equipment: { select: this.equipmentSelect } } } },
    });

    return this.buildBreakdown(
      pkg.id,
      pkg.name,
      brandId,
      instanceOps,
      inquiry.selected_package_id,
      userId,
      inquiryId,
    );
  }

  // ─── Shared helpers ──────────────────────────────────────────────────

  private readonly equipmentSelect = {
    id: true as const,
    item_name: true as const,
    category: true as const,
    rental_price_per_day: true as const,
  };

  private calculateEquipment(operators: OperatorWithEquipment[]) {
    let cameras = 0;
    let audio = 0;
    let totalCost = 0;
    const seen = new Set<number>();
    const items: PriceBreakdown['equipment']['items'] = [];

    for (const op of operators) {
      for (const eq of op.equipment) {
        if (eq.equipment.category === 'CAMERA') cameras++;
        else if (eq.equipment.category === 'AUDIO') audio++;
        if (!seen.has(eq.equipment_id)) {
          seen.add(eq.equipment_id);
          const dailyRate = Number(eq.equipment.rental_price_per_day || 0);
          totalCost += dailyRate;
          items.push({ name: eq.equipment.item_name, category: String(eq.equipment.category), dailyRate });
        }
      }
    }
    return { cameras, audio, totalItems: seen.size, dailyCost: roundMoney(totalCost), items, rawCost: totalCost };
  }

  private async calculateTaskCosts(
    packageId: number,
    brandId: number,
    userId: number,
    inquiryId?: number,
  ) {
    const warnings: string[] = [];
    let totalTasks = 0;
    let totalHours = 0;
    let totalCost = 0;
    const byPhase: PriceBreakdown['tasks']['byPhase'] = {};

    try {
      const preview = await this.taskLibraryService.previewAutoGeneration(
        packageId, brandId, userId, inquiryId,
      );
      const production = preview.tasks.filter(
        t => !PricingService.PRICING_EXCLUDED_PHASES.has(t.phase),
      );
      totalTasks = production.reduce((s, t) => s + t.total_instances, 0);
      totalHours = production.reduce((s, t) => s + t.total_hours, 0);
      totalCost = production.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);

      for (const [phase, tasks] of Object.entries(preview.byPhase)) {
        if (PricingService.PRICING_EXCLUDED_PHASES.has(phase)) continue;
        const pt = tasks as Array<{ total_instances: number; total_hours: number; estimated_cost: number | null }>;
        byPhase[phase] = {
          taskCount: pt.reduce((s, t) => s + t.total_instances, 0),
          hours: roundMoney(pt.reduce((s, t) => s + t.total_hours, 0)),
          cost: roundMoney(pt.reduce((s, t) => s + (t.estimated_cost ?? 0), 0)),
        };
      }
    } catch (err: unknown) {
      warnings.push(`Task cost unavailable: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    return { totalTasks, totalHours, totalCost, byPhase, warnings };
  }

  private async buildBreakdown(
    packageId: number,
    packageName: string,
    brandId: number,
    operators: OperatorWithEquipment[],
    taskPackageId: number,
    userId: number,
    inquiryId?: number,
  ): Promise<PriceBreakdown> {
    const equip = this.calculateEquipment(operators);
    const crewHours = operators.reduce((s, op) => s + Number(op.hours ?? 0), 0);
    const tasks = await this.calculateTaskCosts(taskPackageId, brandId, userId, inquiryId);

    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true, default_tax_rate: true },
    });

    const subtotal = roundMoney(equip.rawCost + tasks.totalCost);
    const taxRate = Number(brand?.default_tax_rate ?? 0);
    const tax = computeTaxBreakdown(subtotal, taxRate);

    return {
      packageId,
      packageName,
      currency: brand?.currency ?? DEFAULT_CURRENCY,
      equipment: { cameras: equip.cameras, audio: equip.audio, totalItems: equip.totalItems, dailyCost: equip.dailyCost, items: equip.items },
      crew: { operatorCount: operators.length, totalHours: crewHours, totalCost: roundMoney(tasks.totalCost), operators: [] },
      tasks: { totalTasks: tasks.totalTasks, totalHours: tasks.totalHours, totalCost: roundMoney(tasks.totalCost), byPhase: tasks.byPhase },
      summary: { equipmentCost: equip.dailyCost, crewCost: roundMoney(tasks.totalCost), subtotal },
      tax: { rate: tax.taxRate, amount: tax.taxAmount, totalWithTax: tax.total },
      warnings: tasks.warnings,
    };
  }
}