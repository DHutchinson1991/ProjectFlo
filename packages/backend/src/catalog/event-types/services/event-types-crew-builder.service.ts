import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class EventTypesCrewBuilderService {
  private readonly logger = new Logger(EventTypesCrewBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create crew operator assignments for a package event day.
   * Returns a Map of `contributorId:jobRoleId` → operator record ID.
   */
  async createCrewAssignments(
    crewAssignments: Array<{
      contributorId: number;
      jobRoleId: number;
      label?: string;
    }>,
    packageId: number,
    eventDayTemplateId: number,
  ): Promise<Map<string, number>> {
    const createdMap = new Map<string, number>();
    let crewIdx = 0;

    for (const crew of crewAssignments) {
      try {
        const operator = await this.prisma.packageCrewSlot.create({
          data: {
            package_id: packageId,
            event_day_template_id: eventDayTemplateId,
            crew_member_id: crew.contributorId,
            job_role_id: crew.jobRoleId,
            label: crew.label || null,
            hours: 8,
            order_index: crewIdx++,
          },
        });
        createdMap.set(`${crew.contributorId}:${crew.jobRoleId}`, operator.id);
      } catch {
        // unique constraint violation — skip duplicate
      }
    }

    return createdMap;
  }

  /**
   * Attach equipment items to crew operator slots.
   */
  async attachEquipment(
    equipmentSlots: Array<{
      equipmentId: number;
      slotLabel: string;
      slotType: string;
      contributorId?: number;
      jobRoleId?: number;
    }>,
    crewOperatorMap: Map<string, number>,
  ) {
    for (const slot of equipmentSlots) {
      if (!slot.contributorId || !slot.jobRoleId) continue;

      const operatorId = crewOperatorMap.get(
        `${slot.contributorId}:${slot.jobRoleId}`,
      );
      if (!operatorId) continue;

      try {
        await this.prisma.packageCrewSlotEquipment.create({
          data: {
            package_crew_slot_id: operatorId,
            equipment_id: slot.equipmentId,
            is_primary: slot.slotLabel.includes('1'),
          },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to attach equipment slot "${slot.slotLabel}" to crew operator`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }

  /**
   * Delete any orphan "equipment-as-operator" placeholder records
   * that have no real contributor and no job role.
   */
  async cleanupOrphans(packageId: number) {
    await this.prisma.packageCrewSlot.deleteMany({
      where: {
        package_id: packageId,
        crew_member_id: null,
        job_role_id: null,
      },
    });
  }
}
