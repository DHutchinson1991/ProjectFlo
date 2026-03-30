import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_CURRENCY,
  computeEquipmentBreakdown,
  computeTaskCostBreakdown,
  computeCrewCost,
  computePackagePricing,
  roundMoney,
} from '@projectflo/shared';
import type { PricingTaskRow } from '@projectflo/shared';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { TaskLibraryService } from '../../workflow/task-library/task-library.service';
import { PriceBreakdown } from './types/price-breakdown';

/** Re-export for consumers that imported from here. */
export { PriceBreakdown } from './types/price-breakdown';

/** Crew-slot shape common to both template and instance queries. */
interface CrewSlotWithEquipment {
  hours: number | string | { toString(): string } | null;
  job_role_id?: number | null;
  crew_id?: number | null;
  crew?: {
    job_role_assignments?: Array<{
      job_role_id?: number | null;
      is_primary?: boolean;
      payment_bracket?: {
        hourly_rate?: unknown;
        day_rate?: unknown;
      } | null;
    }>;
  } | null;
  equipment: Array<{
    equipment_id: number;
    equipment: {
      id: number;
      item_name: string;
      category: string | null;
      rental_price_per_day: number | string | { toString(): string } | null;
    };
  }>;
}

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskLibraryService: TaskLibraryService,
  ) {}

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
          include: {
            crew: { include: { job_role_assignments: { include: { payment_bracket: true } } } },
            job_role: true,
            equipment: { include: { equipment: { select: this.equipmentSelect } } },
          },
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
      include: {
        crew: { include: { job_role_assignments: { include: { payment_bracket: true } } } },
        job_role: true,
        equipment: { include: { equipment: { select: this.equipmentSelect } } },
      },
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

  private async fetchTaskPreview(
    packageId: number,
    brandId: number,
    userId: number,
    inquiryId?: number,
  ): Promise<{ tasks: PricingTaskRow[]; warnings: string[] }> {
    try {
      const preview = await this.taskLibraryService.previewAutoGeneration(
        packageId, brandId, userId, inquiryId,
      );
      return { tasks: preview.tasks, warnings: [] };
    } catch (err: unknown) {
      return {
        tasks: [],
        warnings: [`Task cost unavailable: ${err instanceof Error ? err.message : 'unknown error'}`],
      };
    }
  }

  private async buildBreakdown(
    packageId: number,
    packageName: string,
    brandId: number,
    crewSlots: CrewSlotWithEquipment[],
    taskPackageId: number,
    userId: number,
    inquiryId?: number,
  ): Promise<PriceBreakdown> {
    // All computation delegates to @projectflo/shared pure functions
    const equip = computeEquipmentBreakdown(crewSlots);
    const crewHours = crewSlots.reduce((s, slot) => s + Number(slot.hours ?? 0), 0);
    const { tasks: taskRows, warnings } = await this.fetchTaskPreview(taskPackageId, brandId, userId, inquiryId);
    const taskBreakdown = computeTaskCostBreakdown(taskRows);

    // Crew cost = task-based cost + day-rate adjustment (from shared)
    const crewCost = computeCrewCost(taskBreakdown.totalCost, crewSlots);

    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true, default_tax_rate: true },
    });

    const taxRate = Number(brand?.default_tax_rate ?? 0);
    const pricing = computePackagePricing(equip.dailyCost, crewCost, taxRate);

    return {
      packageId,
      packageName,
      currency: brand?.currency ?? DEFAULT_CURRENCY,
      equipment: { cameras: equip.cameras, audio: equip.audio, totalItems: equip.totalItems, dailyCost: equip.dailyCost, items: equip.items },
      crew: { crewCount: crewSlots.length, totalHours: crewHours, totalCost: crewCost, crew: [] },
      tasks: { totalTasks: taskBreakdown.totalTasks, totalHours: taskBreakdown.totalHours, totalCost: roundMoney(taskBreakdown.totalCost), byPhase: taskBreakdown.byPhase },
      summary: { equipmentCost: pricing.equipmentCost, crewCost: pricing.crewCost, subtotal: pricing.subtotal },
      tax: { rate: pricing.tax.rate, amount: pricing.tax.amount, totalWithTax: pricing.tax.totalWithTax },
      warnings,
    };
  }
}