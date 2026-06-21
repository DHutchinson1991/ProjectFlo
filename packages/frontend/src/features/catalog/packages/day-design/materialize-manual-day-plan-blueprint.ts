import { dayBlueprintsApi } from '@/features/content/day-blueprints/api';
import { dayBlueprintsAuthoringApi } from '@/features/content/day-blueprints/api/authoring';
import type { ManualDayPlan } from '../components/creation/helpers/manual-day-plan';
import { PACKAGE_PLANNING_GUEST_COUNT } from '../components/creation/helpers/wizard-helpers';
import { buildKey } from './build-ai-brief-payload';

export interface ManualDayPlanBlueprintResult {
  blueprintId: number;
  versionId: number;
  activityIds: number[];
}

/**
 * Turn a wizard manual day plan into an ephemeral Day Blueprint (DRAFT) so
 * package creation can consume it and stamp blueprint lineage on the package.
 */
export async function materializeManualDayPlanBlueprint(params: {
  manualDayPlan: ManualDayPlan;
  eventCategory: string;
  displayName: string;
}): Promise<ManualDayPlanBlueprintResult> {
  const { manualDayPlan, eventCategory, displayName } = params;
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

  const initialEventDayRoles = Object.fromEntries(
    manualDayPlan.days.flatMap((day, index) =>
      day.role ? [[String(index + 1), day.role] as const] : [],
    ),
  );

  const blueprint = await dayBlueprintsApi.create({
    key: `${buildKey(displayName)}-${stamp}`,
    display_name: displayName.trim(),
    event_category: eventCategory.trim(),
    variant_tags: { package_wizard_ephemeral: true },
    is_active: false,
    initial_guest_count: PACKAGE_PLANNING_GUEST_COUNT,
    initial_event_days: manualDayPlan.eventDays,
    initial_event_day_roles: initialEventDayRoles,
  });

  await dayBlueprintsApi.update(blueprint.id, {
    is_active: false,
    variant_tags: { package_wizard_ephemeral: true },
  });

  const versions = await dayBlueprintsApi.versions.list(blueprint.id);
  const draftVersionId = versions.find((version) => version.status === 'DRAFT')?.id ?? versions[0]?.id;
  if (!draftVersionId) {
    throw new Error('Failed to resolve day design draft version');
  }

  const versionDetail = await dayBlueprintsApi.versions.getById(blueprint.id, draftVersionId);
  const blueprintDays = [...(versionDetail.days ?? [])].sort((a, b) => a.order_index - b.order_index);

  while (blueprintDays.length < manualDayPlan.days.length) {
    const planDay = manualDayPlan.days[blueprintDays.length];
    const createdDay = await dayBlueprintsAuthoringApi.days.create(draftVersionId, {
      name: planDay.customName?.trim() || planDay.name,
      order_index: planDay.order_index,
    });
    blueprintDays.push(createdDay);
  }

  const activityIds: number[] = [];

  for (let dayIndex = 0; dayIndex < manualDayPlan.days.length; dayIndex += 1) {
    const planDay = manualDayPlan.days[dayIndex];
    const blueprintDay = blueprintDays[dayIndex];
    if (!blueprintDay) continue;

    const resolvedName = planDay.customName?.trim() || planDay.name;
    if (blueprintDay.name !== resolvedName) {
      await dayBlueprintsAuthoringApi.days.update(blueprintDay.id, { name: resolvedName });
    }

    const selectedActivities = planDay.activities.filter((activity) => activity.selected);
    for (let activityOrder = 0; activityOrder < selectedActivities.length; activityOrder += 1) {
      const planActivity = selectedActivities[activityOrder];
      const createdActivity = await dayBlueprintsAuthoringApi.activities.create(blueprintDay.id, {
        name: planActivity.name,
        default_duration_minutes: planActivity.durationMinutes,
        duration_min_minutes: Math.max(5, planActivity.durationMinutes - 10),
        duration_max_minutes: planActivity.durationMinutes + 10,
        order_index: activityOrder,
        criticality: 'REQUIRED',
      });
      activityIds.push(createdActivity.id);

      const selectedMoments = planActivity.moments.filter((moment) => moment.selected);
      for (let momentOrder = 0; momentOrder < selectedMoments.length; momentOrder += 1) {
        const planMoment = selectedMoments[momentOrder];
        await dayBlueprintsAuthoringApi.moments.create(createdActivity.id, {
          name: planMoment.name,
          duration_seconds: planMoment.durationSeconds ?? 60,
          order_index: momentOrder,
          is_key_moment: planMoment.isKeyMoment ?? false,
          criticality: planMoment.isKeyMoment ? 'REQUIRED' : 'PREFERRED',
        });
      }
    }
  }

  if (activityIds.length === 0) {
    throw new Error('Day design must include at least one activity');
  }

  return {
    blueprintId: blueprint.id,
    versionId: draftVersionId,
    activityIds,
  };
}
