import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';

@Injectable()
export class CrewBuilder {
  private readonly logger = new Logger(CrewBuilder.name);

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
    roleSlots: Array<{ jobRoleId: number; quantity: number }>,
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

    // Build a lookup of assigned crew per role position
    // Key: `jobRoleId:positionIndex` → crewAssignment
    const assignmentsByRole = new Map<number, typeof crewAssignments>();
    for (const a of crewAssignments) {
      const list = assignmentsByRole.get(a.jobRoleId) || [];
      list.push(a);
      assignmentsByRole.set(a.jobRoleId, list);
    }

    // Create slots from roleSlots (both assigned and unassigned)
    for (const slot of roleSlots) {
      const assignments = assignmentsByRole.get(slot.jobRoleId) || [];
      for (let i = 0; i < slot.quantity; i++) {
        const assignment = assignments[i]; // may be undefined for unassigned positions
        try {
          const label =
            assignment?.label ||
            (slot.quantity > 1 ? `Position ${i + 1}` : null);
          const crewSlot = await this.prisma.packageCrewSlot.create({
            data: {
              package_id: packageId,
              package_event_day_id: packageEventDay.id,
              crew_id: assignment?.crewId || null,
              job_role_id: slot.jobRoleId,
              label,
              hours: 8,
              order_index: crewIdx++,
            },
          });
          if (assignment) {
            createdMap.set(
              `${assignment.crewId}:${assignment.jobRoleId}`,
              crewSlot.id,
            );
          }
        } catch {
          // unique constraint violation — skip duplicate
        }
      }
    }

    // Also create slots for any crew assignments not covered by roleSlots
    // (backward compatibility for old wizard flow)
    for (const crew of crewAssignments) {
      const key = `${crew.crewId}:${crew.jobRoleId}`;
      if (createdMap.has(key)) continue;
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
        createdMap.set(key, crewSlot.id);
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
   * No-op: previously deleted all crew_id=null slots, but with roles-first
   * flow those are intentional unassigned positions. Kept for interface compat.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cleanupOrphans(_packageId: number) {
    // Intentionally empty — unassigned role positions are valid
  }
}
