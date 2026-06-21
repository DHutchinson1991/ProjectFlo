import type { DayBlueprintDay } from '@/features/content/day-blueprints/types';
import type { DayDesignSource } from '../hooks/useWizardState';
import type { ManualDayPlan, ManualDayPlanDay } from './manual-day-plan';
import { DEFAULT_LOCATION_COUNT } from './location-helpers';

export interface ReviewDaySummary {
  key: string;
  name: string;
  activityCount: number;
  locationCount: number;
}

interface BlueprintScaffoldDay {
  id: number;
  name: string;
  order_index: number;
}

interface SelectedDayLink {
  id: number;
  event_day_template: {
    name: string;
    activity_presets: Array<{ id: number }>;
  };
}

interface CustomActivity {
  dayLinkId: number;
}

function padLocationCounts(counts: number[], targetLength: number, fallback: number): number[] {
  if (targetLength <= 0) return counts.length > 0 ? counts : [fallback];
  const next = counts.slice(0, targetLength);
  while (next.length < targetLength) next.push(fallback);
  return next;
}

/** Resolve per-day location counts aligned to the authoritative day count for each design path. */
export function resolveLocationCountsByDay(params: {
  dayDesignSource: DayDesignSource;
  manualDayPlan: ManualDayPlan | null;
  sourceDayBlueprintVersionId: number | null;
  blueprintScaffoldDays: BlueprintScaffoldDay[];
  blueprintDaysFromVersion: BlueprintScaffoldDay[];
  locationCountByBlueprintDayId: Record<number, number>;
  locationCount: number;
  blueprintDayCount: number;
  legacyDayCount: number;
}): number[] {
  const {
    dayDesignSource,
    manualDayPlan,
    sourceDayBlueprintVersionId,
    blueprintScaffoldDays,
    blueprintDaysFromVersion,
    locationCountByBlueprintDayId,
    locationCount,
    blueprintDayCount,
    legacyDayCount,
  } = params;

  if (dayDesignSource === 'manual' && manualDayPlan) {
    const counts = manualDayPlan.days.map((day) => day.locationCount);
    return padLocationCounts(counts, manualDayPlan.eventDays, locationCount);
  }

  if (sourceDayBlueprintVersionId !== null) {
    const blueprintDays =
      blueprintDaysFromVersion.length > 0
        ? blueprintDaysFromVersion
        : blueprintScaffoldDays;
    const targetLength = Math.max(
      blueprintDayCount,
      blueprintDays.length,
      Object.keys(locationCountByBlueprintDayId).length,
      1,
    );

    if (blueprintDays.length > 0) {
      const counts = blueprintDays.map(
        (day) => locationCountByBlueprintDayId[day.id] ?? DEFAULT_LOCATION_COUNT,
      );
      return padLocationCounts(counts, targetLength, locationCount);
    }

    return Array.from({ length: targetLength }, () => locationCount);
  }

  if (legacyDayCount > 0) {
    return Array.from({ length: legacyDayCount }, () => locationCount);
  }

  return [locationCount];
}

export function buildReviewDaySummaries(params: {
  dayDesignSource: DayDesignSource;
  manualDayPlan: ManualDayPlan | null;
  sourceDayBlueprintVersionId: number | null;
  blueprintScaffoldDays: BlueprintScaffoldDay[];
  blueprintDaysFromVersion: Array<Pick<DayBlueprintDay, 'id' | 'name' | 'order_index' | 'activities'>>;
  locationCountByBlueprintDayId: Record<number, number>;
  locationCount: number;
  blueprintDayCount: number;
  selectedBlueprintActivityIds: Set<number>;
  selectedDays: SelectedDayLink[];
  selectedPresetIds: Set<number>;
  customActivities: CustomActivity[];
}): ReviewDaySummary[] {
  const locationCounts = resolveLocationCountsByDay({
    dayDesignSource: params.dayDesignSource,
    manualDayPlan: params.manualDayPlan,
    sourceDayBlueprintVersionId: params.sourceDayBlueprintVersionId,
    blueprintScaffoldDays: params.blueprintScaffoldDays,
    blueprintDaysFromVersion: params.blueprintDaysFromVersion.map((day) => ({
      id: day.id,
      name: day.name,
      order_index: day.order_index,
    })),
    locationCountByBlueprintDayId: params.locationCountByBlueprintDayId,
    locationCount: params.locationCount,
    blueprintDayCount: params.blueprintDayCount,
    legacyDayCount: params.selectedDays.length,
  });

  if (params.dayDesignSource === 'manual' && params.manualDayPlan) {
    const { manualDayPlan } = params;
    const dayEntries: ManualDayPlanDay[] = manualDayPlan.days.length >= manualDayPlan.eventDays
      ? manualDayPlan.days
      : [
          ...manualDayPlan.days,
          ...Array.from({ length: manualDayPlan.eventDays - manualDayPlan.days.length }, (_, index) => ({
            name: `Day ${manualDayPlan.days.length + index + 1}`,
            order_index: manualDayPlan.days.length + index,
            locationCount: locationCounts[manualDayPlan.days.length + index] ?? DEFAULT_LOCATION_COUNT,
            activities: [],
          })),
        ];

    return dayEntries.map((day, index) => ({
      key: `manual-${day.order_index}`,
      name: day.customName?.trim() || day.name,
      activityCount: day.activities.filter((activity) => activity.selected).length,
      locationCount: locationCounts[index] ?? day.locationCount ?? DEFAULT_LOCATION_COUNT,
    }));
  }

  if (params.sourceDayBlueprintVersionId !== null) {
    const versionDays = params.blueprintDaysFromVersion.slice().sort((a, b) => a.order_index - b.order_index);
    const scaffoldDays = params.blueprintScaffoldDays.slice().sort((a, b) => a.order_index - b.order_index);
    const blueprintDays = versionDays.length > 0 ? versionDays : scaffoldDays;

    const targetLength = Math.max(
      params.blueprintDayCount,
      blueprintDays.length,
      locationCounts.length,
      1,
    );

    return Array.from({ length: targetLength }, (_, index) => {
      const versionDay = versionDays[index];
      const scaffoldDay = scaffoldDays[index];
      const day = versionDay ?? scaffoldDay;
      const activityCount = versionDay
        ? (versionDay.activities ?? []).filter((activity) => params.selectedBlueprintActivityIds.has(activity.id)).length
        : 0;
      return {
        key: day ? `blueprint-${day.id}` : `blueprint-fallback-${index}`,
        name: day?.name ?? `Day ${index + 1}`,
        activityCount,
        locationCount: locationCounts[index] ?? DEFAULT_LOCATION_COUNT,
      };
    });
  }

  return params.selectedDays.map((link, index) => {
    const presets = (link.event_day_template.activity_presets || []).filter((preset) =>
      params.selectedPresetIds.has(preset.id),
    );
    const customCount = params.customActivities.filter((activity) => activity.dayLinkId === link.id).length;
    return {
      key: `legacy-${link.id}`,
      name: link.event_day_template.name,
      activityCount: presets.length + customCount,
      locationCount: locationCounts[index] ?? params.locationCount,
    };
  });
}
