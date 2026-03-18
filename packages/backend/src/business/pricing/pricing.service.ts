import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskLibraryService } from '../task-library/task-library.service';

export interface PriceBreakdown {
  packageId: number;
  packageName: string;
  currency: string;
  equipment: {
    cameras: number;
    audio: number;
    totalItems: number;
    dailyCost: number;
    items: Array<{ name: string; category: string; dailyRate: number }>;
  };
  crew: {
    operatorCount: number;
    totalHours: number;
    totalCost: number;
    operators: Array<{ position: string; hours: number; rate: number; cost: number }>;
  };
  tasks: {
    totalTasks: number;
    totalHours: number;
    totalCost: number;
    byPhase: Record<string, { taskCount: number; hours: number; cost: number }>;
  };
  summary: {
    equipmentCost: number;
    crewCost: number;  // = task-based cost (previewAutoGeneration) — tasks ARE the crew work
    subtotal: number; // = equipmentCost + crewCost
  };
  tax: {
    rate: number;
    amount: number;
    totalWithTax: number;
  };
  warnings: string[];
}

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskLibraryService: TaskLibraryService,
  ) {}

  // Phases that are sales-pipeline admin work, not production crew cost
  private static readonly PRICING_EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

  /**
   * Compute a full price breakdown for a saved package.
   * Combines: equipment rental costs + crew hourly costs + task-based costs.
   */
  async estimatePackagePrice(
    packageId: number,
    brandId: number,
    userId: number,
  ): Promise<PriceBreakdown> {
    // 1. Load package with operators + equipment
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      include: {
        package_day_operators: {
          include: {
            equipment: {
              include: {
                equipment: {
                  select: {
                    id: true,
                    item_name: true,
                    category: true,
                    rental_price_per_day: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pkg) throw new NotFoundException('Package not found');

    const warnings: string[] = [];

    // ── Equipment cost ──
    let cameraCount = 0;
    let audioCount = 0;
    let totalEquipmentCost = 0;
    const equipmentSeen = new Set<number>();
    const equipmentItems: PriceBreakdown['equipment']['items'] = [];

    for (const op of pkg.package_day_operators) {
      for (const eq of op.equipment) {
        if (eq.equipment.category === 'CAMERA') cameraCount++;
        else if (eq.equipment.category === 'AUDIO') audioCount++;

        if (!equipmentSeen.has(eq.equipment_id)) {
          equipmentSeen.add(eq.equipment_id);
          const dailyRate = Number(eq.equipment.rental_price_per_day || 0);
          totalEquipmentCost += dailyRate;
          equipmentItems.push({
            name: eq.equipment.item_name,
            category: String(eq.equipment.category),
            dailyRate,
          });
        }
      }
    }

    // ── Crew headcount (for display — cost comes entirely from task-based pricing below) ──
    let totalCrewHours = 0;
    for (const op of pkg.package_day_operators) {
      totalCrewHours += Number(op.hours || 0);
    }

    // ── Task-based cost via previewAutoGeneration (this IS the crew cost) ──
    // Exclude sales-pipeline phases (Lead, Inquiry, Booking) — those are admin
    // tasks, not production work, so they don't factor into the package price.
    let taskTotalTasks = 0;
    let taskTotalHours = 0;
    let taskTotalCost = 0;
    const taskByPhase: PriceBreakdown['tasks']['byPhase'] = {};

    try {
      const preview = await this.taskLibraryService.previewAutoGeneration(
        packageId, brandId, userId,
      );
      const productionTasks = preview.tasks.filter(
        t => !PricingService.PRICING_EXCLUDED_PHASES.has(t.phase),
      );
      taskTotalTasks = productionTasks.reduce((s, t) => s + t.total_instances, 0);
      taskTotalHours = productionTasks.reduce((s, t) => s + t.total_hours, 0);
      taskTotalCost = productionTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);

      for (const [phase, tasks] of Object.entries(preview.byPhase)) {
        if (PricingService.PRICING_EXCLUDED_PHASES.has(phase)) continue;
        const phaseTasks = tasks as Array<{ total_instances: number; total_hours: number; estimated_cost: number | null }>;
        taskByPhase[phase] = {
          taskCount: phaseTasks.reduce((s, t) => s + t.total_instances, 0),
          hours: Math.round(phaseTasks.reduce((s, t) => s + t.total_hours, 0) * 100) / 100,
          cost: Math.round(phaseTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0) * 100) / 100,
        };
      }
    } catch (err: any) {
      // Task preview may fail if no task library entries exist — equipment cost still valid
      warnings.push(`Task cost unavailable: ${err.message || 'unknown error'}`);
    }

    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true, default_tax_rate: true },
    });

    return {
      packageId: pkg.id,
      packageName: pkg.name,
      currency: brand?.currency || 'USD',
      equipment: {
        cameras: cameraCount,
        audio: audioCount,
        totalItems: equipmentSeen.size,
        dailyCost: Math.round(totalEquipmentCost * 100) / 100,
        items: equipmentItems,
      },
      crew: {
        operatorCount: pkg.package_day_operators.length,
        totalHours: totalCrewHours,
        totalCost: Math.round(taskTotalCost * 100) / 100,
        operators: [],
      },
      tasks: {
        totalTasks: taskTotalTasks,
        totalHours: taskTotalHours,
        totalCost: Math.round(taskTotalCost * 100) / 100,
        byPhase: taskByPhase,
      },
      summary: {
        equipmentCost: Math.round(totalEquipmentCost * 100) / 100,
        crewCost: Math.round(taskTotalCost * 100) / 100,
        subtotal: Math.round((totalEquipmentCost + taskTotalCost) * 100) / 100,
      },
      tax: (() => {
        const subtotal = Math.round((totalEquipmentCost + taskTotalCost) * 100) / 100;
        const rate = Number(brand?.default_tax_rate ?? 0);
        const amount = Math.round(subtotal * (rate / 100) * 100) / 100;
        const totalWithTax = Math.round((subtotal + amount) * 100) / 100;
        return { rate, amount, totalWithTax };
      })(),
      warnings,
    };
  }

  /**
   * Compute a full price breakdown for an inquiry's selected package using
   * the inquiry's **actual instance operators** (project_day_operators) rather
   * than the package template operators. This gives the exact cost for a
   * specific inquiry, reflecting any crew/equipment changes made after the
   * package was assigned.
   */
  async estimateInquiryPrice(
    inquiryId: number,
    brandId: number,
    userId: number,
  ): Promise<PriceBreakdown> {
    // 1. Load the inquiry to get selected_package_id
    const inquiry = await this.prisma.inquiries.findFirst({
      where: { id: inquiryId },
      select: { id: true, selected_package_id: true },
    });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    if (!inquiry.selected_package_id) throw new NotFoundException('Inquiry has no selected package');

    // 2. Load package name + brand info
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: inquiry.selected_package_id, brand_id: brandId },
      select: { id: true, name: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // 3. Load instance operators with equipment
    const instanceOps = await this.prisma.projectDayOperator.findMany({
      where: { inquiry_id: inquiryId },
      include: {
        equipment: {
          include: {
            equipment: {
              select: {
                id: true,
                item_name: true,
                category: true,
                rental_price_per_day: true,
              },
            },
          },
        },
      },
    });

    const warnings: string[] = [];

    // ── Equipment cost (deduplicated by equipment_id) ──
    let cameraCount = 0;
    let audioCount = 0;
    let totalEquipmentCost = 0;
    const equipmentSeen = new Set<number>();
    const equipmentItems: PriceBreakdown['equipment']['items'] = [];

    for (const op of instanceOps) {
      for (const eq of op.equipment) {
        if (eq.equipment.category === 'CAMERA') cameraCount++;
        else if (eq.equipment.category === 'AUDIO') audioCount++;

        if (!equipmentSeen.has(eq.equipment_id)) {
          equipmentSeen.add(eq.equipment_id);
          const dailyRate = Number(eq.equipment.rental_price_per_day || 0);
          totalEquipmentCost += dailyRate;
          equipmentItems.push({
            name: eq.equipment.item_name,
            category: String(eq.equipment.category),
            dailyRate,
          });
        }
      }
    }

    // ── Crew headcount (for display — cost comes entirely from task-based pricing below) ──
    let totalCrewHours = 0;
    for (const op of instanceOps) {
      totalCrewHours += Number(op.hours || 0);
    }

    // ── Task-based cost via previewAutoGeneration (this IS the crew cost) ──
    // Exclude sales-pipeline phases (Lead, Inquiry, Booking) — those are admin
    // tasks, not production work, so they don't factor into the package price.
    let taskTotalTasks = 0;
    let taskTotalHours = 0;
    let taskTotalCost = 0;
    const taskByPhase: PriceBreakdown['tasks']['byPhase'] = {};

    try {
      const preview = await this.taskLibraryService.previewAutoGeneration(
        inquiry.selected_package_id, brandId, userId, inquiryId,
      );
      const productionTasks = preview.tasks.filter(
        t => !PricingService.PRICING_EXCLUDED_PHASES.has(t.phase),
      );
      taskTotalTasks = productionTasks.reduce((s, t) => s + t.total_instances, 0);
      taskTotalHours = productionTasks.reduce((s, t) => s + t.total_hours, 0);
      taskTotalCost = productionTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);

      for (const [phase, tasks] of Object.entries(preview.byPhase)) {
        if (PricingService.PRICING_EXCLUDED_PHASES.has(phase)) continue;
        const phaseTasks = tasks as Array<{ total_instances: number; total_hours: number; estimated_cost: number | null }>;
        taskByPhase[phase] = {
          taskCount: phaseTasks.reduce((s, t) => s + t.total_instances, 0),
          hours: Math.round(phaseTasks.reduce((s, t) => s + t.total_hours, 0) * 100) / 100,
          cost: Math.round(phaseTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0) * 100) / 100,
        };
      }
    } catch (err: any) {
      warnings.push(`Task cost unavailable: ${err.message || 'unknown error'}`);
    }

    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: { currency: true, default_tax_rate: true },
    });

    const subtotal = Math.round((totalEquipmentCost + taskTotalCost) * 100) / 100;
    const taxRate = Number(brand?.default_tax_rate ?? 0);
    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const totalWithTax = Math.round((subtotal + taxAmount) * 100) / 100;

    return {
      packageId: pkg.id,
      packageName: pkg.name,
      currency: brand?.currency || 'USD',
      equipment: {
        cameras: cameraCount,
        audio: audioCount,
        totalItems: equipmentSeen.size,
        dailyCost: Math.round(totalEquipmentCost * 100) / 100,
        items: equipmentItems,
      },
      crew: {
        operatorCount: instanceOps.length,
        totalHours: totalCrewHours,
        totalCost: Math.round(taskTotalCost * 100) / 100,
        operators: [],
      },
      tasks: {
        totalTasks: taskTotalTasks,
        totalHours: taskTotalHours,
        totalCost: Math.round(taskTotalCost * 100) / 100,
        byPhase: taskByPhase,
      },
      summary: {
        equipmentCost: Math.round(totalEquipmentCost * 100) / 100,
        crewCost: Math.round(taskTotalCost * 100) / 100,
        subtotal: Math.round((totalEquipmentCost + taskTotalCost) * 100) / 100,
      },
      tax: { rate: taxRate, amount: taxAmount, totalWithTax },
      warnings,
    };
  }

  /**
   * Diagnostic: show the resolved rate + which fallback tier was used for
   * every operator in a package. Useful for debugging $0-cost crew.
   */
  async auditRates(packageId: number, brandId: number) {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      include: {
        package_day_operators: {
          include: {
            contributor: {
              select: {
                id: true,
                default_hourly_rate: true,
                contributor_job_roles: {
                  select: {
                    is_primary: true,
                    job_role_id: true,
                    payment_bracket: {
                      select: { hourly_rate: true, day_rate: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pkg) throw new NotFoundException('Package not found');

    const videographerRole = await this.prisma.job_roles.findFirst({
      where: { name: { equals: 'videographer', mode: 'insensitive' } },
      include: {
        payment_brackets: {
          where: { is_active: true },
          orderBy: { level: 'asc' },
          take: 1,
        },
      },
    });
    const videographerFallback = videographerRole?.payment_brackets?.[0]
      ? Number(videographerRole.payment_brackets[0].hourly_rate)
      : 0;

    const operators = pkg.package_day_operators.map(op => {
      const hours = Number(op.hours || 0);
      let rate = 0;
      let tier = 'none';
      let isDayRate = false;

      if (op.contributor) {
        const roles = op.contributor.contributor_job_roles || [];

        if (op.job_role_id) {
          const match = roles.find(r => r.job_role_id === op.job_role_id);
          if (match?.payment_bracket) {
            const hr = Number(match.payment_bracket.hourly_rate || 0);
            const dr = Number(match.payment_bracket.day_rate || 0);
            if (dr > 0 && hr === 0) { isDayRate = true; rate = dr; tier = 'matched-role-day'; }
            else if (hr > 0) { rate = hr; tier = 'matched-role'; }
          }
        }
        if (rate === 0) {
          const primary = roles.find(r => r.is_primary && r.payment_bracket);
          if (primary?.payment_bracket) {
            const hr = Number(primary.payment_bracket.hourly_rate || 0);
            const dr = Number(primary.payment_bracket.day_rate || 0);
            if (dr > 0 && hr === 0) { isDayRate = true; rate = dr; tier = 'primary-role-day'; }
            else if (hr > 0) { rate = hr; tier = 'primary-role'; }
          }
        }
        if (rate === 0) {
          const anyBracket = roles.find(r => r.payment_bracket);
          if (anyBracket?.payment_bracket) {
            rate = Number(anyBracket.payment_bracket.hourly_rate || 0);
            if (rate > 0) tier = 'any-bracket';
          }
        }
        if (rate === 0) {
          rate = Number(op.contributor.default_hourly_rate || 0);
          if (rate > 0) tier = 'default-hourly';
        }
      } else {
        rate = videographerFallback;
        tier = rate > 0 ? 'videographer-fallback' : 'none';
      }

      return {
        position: op.position_name,
        contributorId: op.contributor_id,
        hours,
        rate,
        isDayRate,
        tier,
        cost: Math.round((isDayRate ? rate * (hours > 0 ? hours : 1) : rate * hours) * 100) / 100,
      };
    });

    return {
      packageId: pkg.id,
      packageName: pkg.name,
      videographerFallbackRate: videographerFallback,
      operators,
    };
  }
}