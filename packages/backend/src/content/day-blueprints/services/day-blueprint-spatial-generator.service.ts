import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DayBlueprintPlacementFacing, DayBlueprintPlacementPosition } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';
import { DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';

interface SpatialGenerateInput {
  activityId?: number;
  momentId?: number;
  /**
   * Optional run id to attach SSE progress events to. When supplied,
   * each subject placement emits `subject-spatial-start` and
   * `subject-spatial-result` events so the People gallery can animate
   * one subject at a time.
   */
  runId?: number;
}

const SUBJECT_ANIMATION_DELAY_MS = 220;

@Injectable()
export class DayBlueprintSpatialGeneratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: DayBlueprintVersionsService,
    private readonly aiEvents: DayBlueprintAiEventsService,
  ) {}

  async generateForDay(versionId: number, dayId: number, input: SpatialGenerateInput) {
    await this.versions.assertDraft(versionId);

    const day = await this.prisma.dayBlueprintDay.findUnique({
      where: { id: dayId },
      include: {
        version: {
          include: {
            subject_roles: {
              include: { subject_role: true },
              orderBy: { order_index: 'asc' },
            },
            space_slots: {
              orderBy: { order_index: 'asc' },
            },
          },
        },
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            activity_locations: {
              orderBy: { order_index: 'asc' },
            },
            moments: {
              orderBy: { order_index: 'asc' },
              include: {
                actions: {
                  orderBy: { order_index: 'asc' },
                },
                placements: {
                  orderBy: { order_index: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    if (!day) throw new NotFoundException('Day not found');
    if (day.day_blueprint_version_id !== versionId) {
      throw new BadRequestException('Day does not belong to this version');
    }

    const targetActivities = input.activityId
      ? day.activities.filter((activity) => activity.id === input.activityId)
      : day.activities;
    if (input.activityId && targetActivities.length === 0) {
      throw new BadRequestException('Activity does not belong to this day');
    }

    if (input.momentId) {
      const belongsToTargetActivity = targetActivities.some((activity) =>
        activity.moments.some((moment) => moment.id === input.momentId),
      );
      if (!belongsToTargetActivity) {
        throw new BadRequestException('Moment does not belong to the selected day/activity');
      }
    }

    const roleById = new Map(
      day.version.subject_roles.map((link) => [link.subject_role_id, link.subject_role?.role_name ?? '']),
    );

    let activitiesTouched = 0;
    let momentsScanned = 0;
    let momentsTouched = 0;
    let placementsCreated = 0;
    let placementsUpdated = 0;
    let placementsRemoved = 0;

    for (const activity of targetActivities) {
      const activitySlot = this.pickActivitySlot(
        day.version.space_slots,
        activity.activity_locations.map((entry) => entry.day_blueprint_location_role_id),
        activity.name,
      );

      const targetMoments = input.momentId
        ? activity.moments.filter((moment) => moment.id === input.momentId)
        : activity.moments;
      if (targetMoments.length === 0) continue;

      let activityChanged = false;

      for (const moment of targetMoments) {
        momentsScanned += 1;

        if (hasNoSpatialLock(moment.lock_flags)) {
          if (moment.placements.length > 0) {
            const removed = await this.prisma.dayBlueprintMomentPlacement.deleteMany({
              where: { day_blueprint_moment_id: moment.id },
            });
            placementsRemoved += removed.count;
            momentsTouched += 1;
            activityChanged = true;
          }
          continue;
        }

        const actionRoleIds = Array.from(new Set(moment.actions.map((action) => action.subject_role_id)));
        const placementRoleIds = Array.from(new Set(moment.placements.map((placement) => placement.subject_role_id)));
        const requiredRoleIds = actionRoleIds.length > 0 ? actionRoleIds : placementRoleIds;
        if (requiredRoleIds.length === 0) continue;

        let nextOrderIndex = moment.placements.length;
        let momentChanged = false;

        const previousPlacementsByRole = new Map(
          moment.placements.map((placement) => [placement.subject_role_id, placement]),
        );
        if (moment.placements.length > 0) {
          await this.prisma.dayBlueprintMomentPlacement.deleteMany({
            where: { day_blueprint_moment_id: moment.id },
          });
          placementsUpdated += moment.placements.length;
          nextOrderIndex = 0;
          momentChanged = true;
        }

        for (const roleId of requiredRoleIds) {
          const existing = previousPlacementsByRole.get(roleId);
          const hints = deriveSpatialHints({
            roleName: roleById.get(roleId) ?? '',
            activityName: activity.name,
            momentName: moment.name,
            roleId,
          });

          if (!activitySlot) continue;

          const versionIdForEvents = day.day_blueprint_version_id;
          if (input.runId != null) {
            this.aiEvents.emit({
              versionId: versionIdForEvents,
              runId: input.runId,
              step: 'subject-spatial',
              label: `Placing ${roleById.get(roleId) ?? 'subject'} in ${moment.name}`,
              status: 'started',
              stepIndex: 3,
              totalSteps: 4,
              data: {
                eventKind: 'subject-spatial-start',
                dayId,
                activityId: activity.id,
                activityName: activity.name,
                momentId: moment.id,
                momentName: moment.name,
                subjectRoleId: roleId,
                subjectRoleLabel: roleById.get(roleId) ?? undefined,
                spaceSlotId: activitySlot.id,
              },
            });
            await new Promise((resolve) => setTimeout(resolve, SUBJECT_ANIMATION_DELAY_MS));
          }

          await this.prisma.dayBlueprintMomentPlacement.create({
            data: {
              day_blueprint_moment_id: moment.id,
              day_blueprint_space_slot_id: activitySlot.id,
              subject_role_id: roleId,
              position_hint: hints.position,
              facing_hint: hints.facing,
              notes: existing?.notes,
              order_index: nextOrderIndex,
            },
          });
          nextOrderIndex += 1;
          placementsCreated += 1;
          momentChanged = true;

          if (input.runId != null) {
            this.aiEvents.emit({
              versionId: versionIdForEvents,
              runId: input.runId,
              step: 'subject-spatial',
              label: `Placed ${roleById.get(roleId) ?? 'subject'} in ${moment.name}`,
              status: 'completed',
              stepIndex: 3,
              totalSteps: 4,
              data: {
                eventKind: 'subject-spatial-result',
                dayId,
                activityId: activity.id,
                activityName: activity.name,
                momentId: moment.id,
                momentName: moment.name,
                subjectRoleId: roleId,
                subjectRoleLabel: roleById.get(roleId) ?? undefined,
                spaceSlotId: activitySlot.id,
                positionHint: hints.position,
                facingHint: hints.facing,
                placementsCreated,
              },
            });
          }
        }

        if (momentChanged) {
          momentsTouched += 1;
          activityChanged = true;
        }
      }

      if (activityChanged) activitiesTouched += 1;
    }

    return {
      dayId,
      activitiesTouched,
      momentsScanned,
      momentsTouched,
      placementsCreated,
      placementsUpdated,
      placementsRemoved,
    };
  }

  private pickActivitySlot(
    slots: Array<{ id: number; day_blueprint_location_role_id: number; key: string; label: string }>,
    activityRoleIds: number[],
    activityName: string,
  ) {
    const byLocation = slots.find((slot) => activityRoleIds.includes(slot.day_blueprint_location_role_id));
    if (byLocation) return byLocation;

    const normalizedActivityName = normalize(activityName);
    const byName = slots.find((slot) => {
      const key = normalize(slot.key);
      const label = normalize(slot.label);
      return key.includes(normalizedActivityName) || label.includes(normalizedActivityName);
    });
    if (byName) return byName;

    return slots[0] ?? null;
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function deriveSpatialHints(input: {
  roleName: string;
  activityName: string;
  momentName: string;
  roleId: number;
}): {
  position: DayBlueprintPlacementPosition;
  facing: DayBlueprintPlacementFacing;
} {
  const role = normalize(input.roleName);
  const activity = normalize(input.activityName);
  const moment = normalize(input.momentName);
  const ceremonyLike = /ceremony|vow|ring|kiss|processional|recessional/.test(`${activity} ${moment}`);

  if (/officiant|celebrant/.test(role)) {
    return {
      position: DayBlueprintPlacementPosition.ALTAR_FRONT,
      facing: DayBlueprintPlacementFacing.TOWARD_AUDIENCE,
    };
  }

  if (/bride|groom|partner|couple/.test(role)) {
    return {
      position: ceremonyLike
        ? DayBlueprintPlacementPosition.ALTAR_FRONT
        : DayBlueprintPlacementPosition.CENTER,
      facing: ceremonyLike
        ? DayBlueprintPlacementFacing.TOWARD_PARTNER
        : DayBlueprintPlacementFacing.TOWARD_CAMERA,
    };
  }

  if (/guest|audience|family/.test(role)) {
    return {
      position: input.roleId % 2 === 0
        ? DayBlueprintPlacementPosition.FIRST_ROW_LEFT
        : DayBlueprintPlacementPosition.FIRST_ROW_RIGHT,
      facing: DayBlueprintPlacementFacing.TOWARD_ALTAR,
    };
  }

  return {
    position: input.roleId % 2 === 0
      ? DayBlueprintPlacementPosition.STAGE_LEFT
      : DayBlueprintPlacementPosition.STAGE_RIGHT,
    facing: DayBlueprintPlacementFacing.TOWARD_CAMERA,
  };
}

function hasNoSpatialLock(lockFlags: unknown): boolean {
  if (!lockFlags || typeof lockFlags !== 'object') return false;
  return Boolean((lockFlags as Record<string, unknown>).no_spatial);
}
