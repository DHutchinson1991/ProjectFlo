import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class EventTypesCrewBuilderService {
  private readonly logger = new Logger(EventTypesCrewBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create crew slot assignments for a package event day.
   * Returns a Map of `crewId:jobRoleId` → crew slot record ID.
   */
  async createCrewAssignments(
    crewAssignments: Array<{
      crewId: number;
      jobRoleId: number;
      label?: string;
    }>,
    packageId: number,
    eventDayTemplateId: number,
  ): Promise<Map<string, number>> {
    const createdMap = new Map<string, number>();
    let crewIdx = 0;

    const packageEventDay = await this.prisma.packageEventDay.findUnique({
      where: {
        package_id_event_day_template_id: {
          package_id: packageId,
          event_day_template_id: eventDayTemplateId,
        },
      },
      select: { id: true },
    });

    if (!packageEventDay) {
      return createdMap;
    }

    for (const crew of crewAssignments) {
      try {
        const crewSlot = await this.prisma.packageCrewSlot.create({
          data: {
            package_id: packageId,
            package_event_day_id: packageEventDay.id,
            crew_id: crew.crewId,
            job_role_id: crew.jobRoleId,
            label: crew.label || null,
            hours: 8,
            order_index: crewIdx++,
          },
        });
        createdMap.set(`${crew.crewId}:${crew.jobRoleId}`, crewSlot.id);
      } catch {
        // unique constraint violation — skip duplicate
      }
    }

    return createdMap;
  }

  /**
   * Attach equipment items to crew slots.
   */
  async attachEquipment(
    equipmentSlots: Array<{
      equipmentId: number;
      slotLabel: string;
      slotType: string;
      crewId?: number;
      jobRoleId?: number;
    }>,
    crewRoleSlotMap: Map<string, number>,
  ) {
    for (const slot of equipmentSlots) {
      if (!slot.crewId || !slot.jobRoleId) continue;

      const crewSlotId = crewRoleSlotMap.get(
        `${slot.crewId}:${slot.jobRoleId}`,
      );
      if (!crewSlotId) continue;

      try {
        await this.prisma.packageCrewSlotEquipment.create({
          data: {
            package_crew_slot_id: crewSlotId,
            equipment_id: slot.equipmentId,
            is_primary: slot.slotLabel.includes('1'),
          },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to attach equipment slot "${slot.slotLabel}" to crew slot`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }

  /**
   * Delete any orphan "equipment-as-placeholder" records
   * that have no real crew and no job role.
   */
  async cleanupOrphans(packageId: number) {
    await this.prisma.packageCrewSlot.deleteMany({
      where: {
        package_id: packageId,
        crew_id: null,
      },
    });
  }
}
