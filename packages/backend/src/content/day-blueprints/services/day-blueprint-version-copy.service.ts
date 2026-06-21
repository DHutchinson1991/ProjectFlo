import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { normalizeName } from './day-blueprint-defaults.helpers';
import { sanitizeDayBlueprintMomentLockFlagsJson } from './day-blueprint-spatial-heuristics';

export const dayBlueprintVersionCopyInclude = {
  subject_roles: { orderBy: { order_index: 'asc' as const } },
  space_slots: { orderBy: { order_index: 'asc' as const } },
  lock_rules: true,
  days: {
    orderBy: { order_index: 'asc' as const },
    include: {
      activities: {
        orderBy: { order_index: 'asc' as const },
        include: {
          activity_locations: { orderBy: { order_index: 'asc' as const } },
          moments: {
            orderBy: { order_index: 'asc' as const },
            include: {
              actions: { orderBy: { order_index: 'asc' as const } },
              placements: { orderBy: { order_index: 'asc' as const } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.DayBlueprintVersionInclude;

export type DayBlueprintVersionCopySource = Prisma.DayBlueprintVersionGetPayload<{
  include: typeof dayBlueprintVersionCopyInclude;
}>;

/**
 * Deep-copies authored structure from one DayBlueprintVersion into another
 * version row (same or different blueprint). Used by clone + draft branching.
 */
@Injectable()
export class DayBlueprintVersionCopyService {
  constructor(private readonly prisma: PrismaService) {}

  async loadSourceVersion(versionId: number): Promise<DayBlueprintVersionCopySource | null> {
    return this.prisma.dayBlueprintVersion.findUnique({
      where: { id: versionId },
      include: dayBlueprintVersionCopyInclude,
    });
  }

  async copyVersionStructure(
    tx: Prisma.TransactionClient,
    params: {
      sourceVersion: DayBlueprintVersionCopySource;
      targetVersionId: number;
      /** When cloning system-seeded templates, guest typical_count is normalized. */
      isSystemSeededBlueprint?: boolean;
    },
  ): Promise<void> {
    const { sourceVersion, targetVersionId, isSystemSeededBlueprint = false } = params;

    const subjectRolesById = new Map(
      (
        await tx.subjectRole.findMany({
          where: { id: { in: sourceVersion.subject_roles.map((role) => role.subject_role_id) } },
          select: { id: true, role_name: true },
        })
      ).map((role) => [role.id, role.role_name] as const),
    );

    for (const role of sourceVersion.subject_roles) {
      const roleName = subjectRolesById.get(role.subject_role_id) ?? '';
      const normalizedRoleName = normalizeName(roleName);
      const clonedTypicalCount =
        isSystemSeededBlueprint && normalizedRoleName === 'guests' ? 50 : role.typical_count;
      await tx.dayBlueprintSubjectRole.create({
        data: {
          day_blueprint_version_id: targetVersionId,
          subject_role_id: role.subject_role_id,
          is_primary: role.is_primary,
          typical_count: clonedTypicalCount,
          order_index: role.order_index,
        },
      });
    }

    const spaceSlotIdMap = new Map<number, number>();
    for (const slot of sourceVersion.space_slots) {
      const created = await tx.dayBlueprintSpaceSlot.create({
        data: {
          day_blueprint_version_id: targetVersionId,
          day_blueprint_location_role_id: slot.day_blueprint_location_role_id,
          key: slot.key,
          label: slot.label,
          description: slot.description,
          order_index: slot.order_index,
        },
      });
      spaceSlotIdMap.set(slot.id, created.id);
    }

    const dayIdMap = new Map<number, number>();
    const activityIdMap = new Map<number, number>();
    const momentIdMap = new Map<number, number>();

    for (const day of sourceVersion.days) {
      const createdDay = await tx.dayBlueprintDay.create({
        data: {
          day_blueprint_version_id: targetVersionId,
          name: day.name,
          description: day.description,
          default_start_time: day.default_start_time,
          default_duration_hours: day.default_duration_hours,
          order_index: day.order_index,
          source_event_day_id: day.source_event_day_id,
        },
      });
      dayIdMap.set(day.id, createdDay.id);

      for (const activity of day.activities) {
        const createdActivity = await tx.dayBlueprintActivity.create({
          data: {
            day_blueprint_day_id: createdDay.id,
            name: activity.name,
            description: activity.description,
            icon: activity.icon,
            color: activity.color,
            default_start_time: activity.default_start_time,
            default_duration_minutes: activity.default_duration_minutes,
            duration_min_minutes: activity.duration_min_minutes,
            duration_max_minutes: activity.duration_max_minutes,
            target_moment_count: activity.target_moment_count,
            order_index: activity.order_index,
            criticality: activity.criticality,
            lock_flags: activity.lock_flags as Prisma.InputJsonValue | undefined,
            source_event_day_activity_id: activity.source_event_day_activity_id,
          },
        });
        activityIdMap.set(activity.id, createdActivity.id);

        for (const location of activity.activity_locations) {
          await tx.dayBlueprintActivityLocation.create({
            data: {
              day_blueprint_activity_id: createdActivity.id,
              day_blueprint_location_role_id: location.day_blueprint_location_role_id,
              is_primary: location.is_primary,
              notes: location.notes,
              order_index: location.order_index,
            },
          });
        }

        for (const moment of activity.moments) {
          const createdMoment = await tx.dayBlueprintMoment.create({
            data: {
              day_blueprint_activity_id: createdActivity.id,
              name: moment.name,
              description: moment.description,
              duration_seconds: moment.duration_seconds,
              order_index: moment.order_index,
              is_key_moment: moment.is_key_moment,
              criticality: moment.criticality,
              lock_flags: sanitizeDayBlueprintMomentLockFlagsJson(moment.lock_flags) as Prisma.InputJsonValue | undefined,
              source_event_day_activity_moment_id: moment.source_event_day_activity_moment_id,
            },
          });
          momentIdMap.set(moment.id, createdMoment.id);

          for (const action of moment.actions) {
            await tx.dayBlueprintMomentAction.create({
              data: {
                day_blueprint_moment_id: createdMoment.id,
                subject_role_id: action.subject_role_id,
                action_text: action.action_text,
                emphasis: action.emphasis,
                notes: action.notes,
                order_index: action.order_index,
              },
            });
          }

          for (const placement of moment.placements) {
            const mappedSpaceSlotId = spaceSlotIdMap.get(placement.day_blueprint_space_slot_id);
            if (!mappedSpaceSlotId) continue;
            await tx.dayBlueprintMomentPlacement.create({
              data: {
                day_blueprint_moment_id: createdMoment.id,
                day_blueprint_space_slot_id: mappedSpaceSlotId,
                subject_role_id: placement.subject_role_id,
                position_hint: placement.position_hint,
                facing_hint: placement.facing_hint,
                notes: placement.notes,
                order_index: placement.order_index,
              },
            });
          }
        }
      }
    }

    for (const rule of sourceVersion.lock_rules) {
      let targetId = rule.target_id;
      if (rule.scope === 'DAY' && rule.target_id != null) {
        targetId = dayIdMap.get(rule.target_id) ?? null;
      } else if (rule.scope === 'ACTIVITY' && rule.target_id != null) {
        targetId = activityIdMap.get(rule.target_id) ?? null;
      } else if (rule.scope === 'MOMENT' && rule.target_id != null) {
        targetId = momentIdMap.get(rule.target_id) ?? null;
      }

      await tx.dayBlueprintLockRule.create({
        data: {
          day_blueprint_version_id: targetVersionId,
          scope: rule.scope,
          target_id: targetId,
          rule_key: rule.rule_key,
          rule_value: rule.rule_value as Prisma.InputJsonValue | undefined,
        },
      });
    }
  }
}
