import { DayBlueprintActionEmphasis, Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { type PrismaService } from '../../../platform/prisma/prisma.service';
import { type DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { type GeneratedActivity, type GeneratedMoment } from './day-blueprint-ai.types';
import { MAX_MOMENT_SECONDS, MIN_MOMENT_SECONDS } from './day-blueprint-outline.rules';
import { clampInt, normalizeRoleName, stableKey } from './day-blueprint-ai.utils';

interface PersistGeneratedPlanInput {
  prisma: PrismaService;
  aiEvents: DayBlueprintAiEventsService;
  checkCancelled: () => void;
  versionId: number;
  dayId: number;
  runId: number;
  activityId?: number;
  dayActivities: Array<{ id: number; name: string }>;
  planActivities: GeneratedActivity[];
}

export async function persistGeneratedPlan(input: PersistGeneratedPlanInput): Promise<{
  momentsCreated: number;
  actionsCreated: number;
  placementsCreated: number;
  momentsWithCoverage: number;
}> {
  const { prisma, aiEvents, checkCancelled, versionId, dayId, runId, activityId, dayActivities, planActivities } = input;
  return prisma.$transaction(async (tx) => {
    let momentsCreated = 0;
    let actionsCreated = 0;
    let placementsPredicted = 0;
    let momentsWithCoverage = 0;
    let wroteSelectedActivity = false;

    const roleCatalog = await tx.dayBlueprintSubjectRole.findMany({
      where: { day_blueprint_version_id: versionId },
      include: { subject_role: true },
      orderBy: { order_index: 'asc' },
    });
    const roleByName = new Map(roleCatalog.map((link) => [normalizeRoleName(link.subject_role.role_name), link]));
    const fallbackRoles = roleCatalog.slice(0, 4);

    const activityByName = new Map(
      dayActivities.map((activity) => [normalizeRoleName(activity.name), activity]),
    );

    const targetActivityIds = activityId
      ? [activityId]
      : dayActivities.map((activity) => activity.id);

    await tx.dayBlueprintMoment.deleteMany({
      where: { day_blueprint_activity_id: { in: targetActivityIds } },
    });

    for (const activity of planActivities) {
      const existing = activityByName.get(normalizeRoleName(activity.name));
      if (!existing) {
        continue;
      }
      if (activityId && existing.id !== activityId) {
        continue;
      }
      if (activityId && existing.id === activityId) {
        wroteSelectedActivity = true;
      }

      if (activity.description) {
        await tx.dayBlueprintActivity.update({
          where: { id: existing.id },
          data: { description: activity.description.slice(0, 2000) },
        });
      }

      const moments = activity.moments ?? [];
      for (let momentIndex = 0; momentIndex < moments.length; momentIndex++) {
        checkCancelled();
        const moment = moments[momentIndex];
        const coverage = resolveMomentCoverage(moment, roleByName, fallbackRoles);
        const previewDurationSeconds = clampInt(moment.duration_seconds, MIN_MOMENT_SECONDS, MAX_MOMENT_SECONDS) ?? 60;
        const previewKey = `${runId}:${existing.id}:${momentIndex}:${stableKey(moment.name).slice(0, 40)}`;

        aiEvents.emit({
          versionId,
          runId,
          step: 'moment-preview',
          label: `Planning ${activity.name} → ${moment.name}`,
          status: 'started',
          stepIndex: 2,
          totalSteps: 4,
          data: {
            eventKind: 'moment-preview',
            dayId,
            activityId: existing.id,
            activityName: activity.name,
            momentName: moment.name,
            momentOrderIndex: momentIndex,
            previewDurationSeconds,
            previewActionCount: coverage.length,
            previewPlacementCount: coverage.length,
            previewKey,
            momentsCreated,
            actionsCreated,
            placementsCreated: placementsPredicted,
            momentsWithCoverage,
          },
        });

        const createdMoment = await tx.dayBlueprintMoment.create({
          data: {
            day_blueprint_activity_id: existing.id,
            name: moment.name.slice(0, 200),
            description: moment.description?.slice(0, 2000),
            duration_seconds: previewDurationSeconds,
            order_index: momentIndex,
            is_key_moment: Boolean(moment.is_key_moment),
            criticality: 'KEY',
          },
        });
        momentsCreated += 1;
        if (coverage.length > 0) momentsWithCoverage += 1;

        for (let actionIndex = 0; actionIndex < coverage.length; actionIndex++) {
          const item = coverage[actionIndex];
          await tx.dayBlueprintMomentAction.create({
            data: {
              day_blueprint_moment_id: createdMoment.id,
              subject_role_id: item.subjectRoleId,
              action_text: item.actionText.slice(0, 2000),
              emphasis: item.emphasis,
              notes: item.notes?.slice(0, 1000),
              order_index: actionIndex,
            },
          });
          actionsCreated += 1;
          placementsPredicted += 1;
        }

        aiEvents.emit({
          versionId,
          runId,
          step: 'moment-persisted',
          label: `Wrote ${activity.name} → ${moment.name}`,
          status: 'completed',
          stepIndex: 2,
          totalSteps: 4,
          data: {
            eventKind: 'moment-persisted',
            dayId,
            activityId: existing.id,
            activityName: activity.name,
            momentName: moment.name,
            momentOrderIndex: momentIndex,
            previewDurationSeconds,
            previewActionCount: coverage.length,
            previewPlacementCount: coverage.length,
            previewKey,
            momentsCreated,
            actionsCreated,
            placementsCreated: placementsPredicted,
            momentsWithCoverage,
          },
        });
      }

      await tx.dayBlueprintAiRun.update({
        where: { id: runId },
        data: {
          prompt_summary: `Writing ${activity.name}: ${momentsCreated} moments, ${actionsCreated} actions so far`,
        },
      });
      aiEvents.emit({
        versionId,
        runId,
        step: 'persist-coverage',
        label: `Writing ${activity.name}: ${momentsCreated} moments, ${actionsCreated} actions`,
        status: 'started',
        stepIndex: 2,
        totalSteps: 4,
        data: {
          eventKind: 'summary',
          dayId,
          activityId: existing.id,
          activityName: activity.name,
          momentsCreated,
          actionsCreated,
          placementsCreated: placementsPredicted,
          momentsWithCoverage,
        },
      });
    }

    if (activityId && !wroteSelectedActivity) {
      throw new BadRequestException('AI response did not include the selected activity');
    }

    return {
      momentsCreated,
      actionsCreated,
      placementsCreated: placementsPredicted,
      momentsWithCoverage,
    };
  });
}

interface CoverageItem {
  subjectRoleId: number;
  actionText: string;
  emphasis: DayBlueprintActionEmphasis;
  notes?: string;
}

function resolveMomentCoverage(
  moment: GeneratedMoment,
  roleByName: Map<string, { subject_role_id: number; subject_role: { role_name: string } }>,
  fallbackRoles: Array<{ subject_role_id: number; subject_role: { role_name: string } }>,
): CoverageItem[] {
  const coverage = new Map<number, CoverageItem>();

  for (const action of moment.subject_actions ?? []) {
    const role = roleByName.get(normalizeRoleName(action.subject_role));
    if (!role) continue;
    coverage.set(role.subject_role_id, {
      subjectRoleId: role.subject_role_id,
      actionText: action.action_text,
      emphasis: parseActionEmphasis(action.emphasis),
      notes: action.notes,
    });
  }

  if (coverage.size === 0) {
    fallbackRoles.forEach((role, index) => {
      coverage.set(role.subject_role_id, {
        subjectRoleId: role.subject_role_id,
        actionText: `${role.subject_role.role_name} is present for ${moment.name}.`,
        emphasis: index === 0 ? DayBlueprintActionEmphasis.PRIMARY : DayBlueprintActionEmphasis.SECONDARY,
      });
    });
  }

  return Array.from(coverage.values());
}

function parseActionEmphasis(value: string | undefined): DayBlueprintActionEmphasis {
  if (value && value in DayBlueprintActionEmphasis) return DayBlueprintActionEmphasis[value as keyof typeof DayBlueprintActionEmphasis];
  return DayBlueprintActionEmphasis.SECONDARY;
}
