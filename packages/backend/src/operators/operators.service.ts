import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Package Crew Slots ───────────────────────────────────────────

  /**
   * Get all crew slots for a package (optionally filtered by event day)
   */
  async getPackageDayOperators(packageId: number, eventDayTemplateId?: number) {
    const where: Record<string, unknown> = { package_id: packageId };
    if (eventDayTemplateId) where.event_day_template_id = eventDayTemplateId;

    return this.prisma.packageDayOperator.findMany({
      where,
      include: {
        contributor: {
          include: {
            contact: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            contributor_job_roles: {
              include: {
                job_role: {
                  select: { id: true, name: true, display_name: true },
                },
                payment_bracket: {
                  select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, day_rate: true },
                },
              },
            },
          },
        },
        job_role: {
          select: { id: true, name: true, display_name: true, category: true },
        },
        equipment: {
          include: { 
            equipment: {
              select: {
                id: true,
                item_name: true,
                category: true,
                type: true,
                model: true,
                is_unmanned: true,
                is_active: true,
              }
            }
          },
        },
        event_day: true,
        package_activity: true,
        activity_assignments: { include: { package_activity: true } },
      },
      orderBy: [{ event_day_template_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /**
   * Add a crew slot to a package event day.
   * The slot can be unassigned (contributor_id = null) or assigned to a real crew member.
   */
  async addCrewSlotToPackageDay(
    packageId: number,
    dto: {
      event_day_template_id: number;
      position_name: string;
      position_color?: string | null;
      contributor_id?: number | null;
      job_role_id?: number | null;
      hours?: number;
      notes?: string;
      package_activity_id?: number | null;
    },
  ) {
    // If contributor_id is provided, verify they exist
    if (dto.contributor_id) {
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: dto.contributor_id },
      });
      if (!contributor) throw new NotFoundException('Crew member not found');
    }

    const maxOrder = await this.prisma.packageDayOperator.aggregate({
      where: {
        package_id: packageId,
        event_day_template_id: dto.event_day_template_id,
      },
      _max: { order_index: true },
    });

    try {
      const slot = await this.prisma.packageDayOperator.create({
        data: {
          package_id: packageId,
          event_day_template_id: dto.event_day_template_id,
          position_name: dto.position_name,
          position_color: dto.position_color ?? null,
          contributor_id: dto.contributor_id ?? null,
          job_role_id: dto.job_role_id ?? null,
          hours: dto.hours ?? 8,
          notes: dto.notes ?? null,
          order_index: (maxOrder._max.order_index ?? -1) + 1,
          package_activity_id: dto.package_activity_id ?? null,
        },
      });

      return this.getCrewSlotById(slot.id);
    } catch {
      throw new ConflictException('A crew slot with this position name already exists for this package day');
    }
  }

  /**
   * Assign or reassign a crew member to an existing slot
   */
  async assignCrewToSlot(
    slotId: number,
    dto: { contributor_id: number | null },
  ) {
    const existing = await this.prisma.packageDayOperator.findUnique({
      where: { id: slotId },
    });
    if (!existing) throw new NotFoundException('Crew slot not found');

    if (dto.contributor_id) {
      const contributor = await this.prisma.contributors.findUnique({
        where: { id: dto.contributor_id },
      });
      if (!contributor) throw new NotFoundException('Crew member not found');
    }

    await this.prisma.packageDayOperator.update({
      where: { id: slotId },
      data: { contributor_id: dto.contributor_id },
    });

    return this.getCrewSlotById(slotId);
  }

  /**
   * Update a crew slot's details
   */
  async updateCrewSlot(
    slotId: number,
    dto: {
      position_name?: string;
      position_color?: string | null;
      contributor_id?: number | null;
      job_role_id?: number | null;
      hours?: number;
      notes?: string | null;
      order_index?: number;
      package_activity_id?: number | null;
    },
  ) {
    const existing = await this.prisma.packageDayOperator.findUnique({
      where: { id: slotId },
    });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.packageDayOperator.update({
      where: { id: slotId },
      data: {
        position_name: dto.position_name ?? undefined,
        position_color: dto.position_color !== undefined ? dto.position_color : undefined,
        contributor_id: dto.contributor_id !== undefined ? dto.contributor_id : undefined,
        job_role_id: dto.job_role_id !== undefined ? dto.job_role_id : undefined,
        hours: dto.hours ?? undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        order_index: dto.order_index ?? undefined,
        package_activity_id: dto.package_activity_id !== undefined ? dto.package_activity_id : undefined,
      },
    });

    return this.getCrewSlotById(slotId);
  }

  /**
   * Remove a crew slot from a package day
   */
  async removeCrewSlot(slotId: number) {
    const existing = await this.prisma.packageDayOperator.findUnique({
      where: { id: slotId },
    });
    if (!existing) throw new NotFoundException('Crew slot not found');
    return this.prisma.packageDayOperator.delete({ where: { id: slotId } });
  }

  // ─── Crew Slot Equipment ──────────────────────────────────────────

  async setSlotEquipment(
    slotId: number,
    equipmentIds: { equipment_id: number; is_primary: boolean }[],
  ) {
    const existing = await this.prisma.packageDayOperator.findUnique({
      where: { id: slotId },
    });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.packageDayOperatorEquipment.deleteMany({
      where: { package_day_operator_id: slotId },
    });

    if (equipmentIds.length > 0) {
      await this.prisma.packageDayOperatorEquipment.createMany({
        data: equipmentIds.map((eq) => ({
          package_day_operator_id: slotId,
          equipment_id: eq.equipment_id,
          is_primary: eq.is_primary,
        })),
        skipDuplicates: true,
      });
    }

    return this.getCrewSlotById(slotId);
  }

  // ─── Activity Assignments ─────────────────────────────────────────

  async assignSlotToActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageDayOperator.findUnique({
      where: { id: slotId },
    });
    if (!existing) throw new NotFoundException('Crew slot not found');

    try {
      await this.prisma.operatorActivityAssignment.create({
        data: {
          package_day_operator_id: slotId,
          package_activity_id: activityId,
        },
      });
    } catch {
      // Already assigned — ignore
    }

    return this.getCrewSlotById(slotId);
  }

  async unassignSlotFromActivity(slotId: number, activityId: number) {
    const existing = await this.prisma.packageDayOperator.findUnique({
      where: { id: slotId },
    });
    if (!existing) throw new NotFoundException('Crew slot not found');

    await this.prisma.operatorActivityAssignment.deleteMany({
      where: {
        package_day_operator_id: slotId,
        package_activity_id: activityId,
      },
    });

    return this.getCrewSlotById(slotId);
  }

  // ─── Helper ───────────────────────────────────────────────────────

  private async getCrewSlotById(slotId: number) {
    return this.prisma.packageDayOperator.findUnique({
      where: { id: slotId },
      include: {
        contributor: {
          include: {
            contact: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            contributor_job_roles: {
              include: {
                job_role: {
                  select: { id: true, name: true, display_name: true },
                },
                payment_bracket: {
                  select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, day_rate: true },
                },
              },
            },
          },
        },
        job_role: {
          select: { id: true, name: true, display_name: true, category: true },
        },
        equipment: { include: { equipment: true } },
        event_day: true,
        activity_assignments: { include: { package_activity: true } },
      },
    });
  }
}
