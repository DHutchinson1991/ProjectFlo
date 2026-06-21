import type { DayBlueprintDay } from '@/features/content/day-blueprints/types';

export const DEFAULT_LOCATION_COUNT = 3;

export function clampLocationCount(count: number): number {
  return Math.max(1, Math.min(5, Math.round(count)));
}

/** Shrink slot count when few activities are selected; never exceed current choice. */
export function autoAdjustLocationCount(activityCount: number, current: number): number {
  const clamped = clampLocationCount(current);
  if (activityCount <= 1) return 1;
  if (activityCount <= 3) return Math.min(clamped, activityCount);
  return clamped;
}

export function defaultLocationCountForBlueprintDay(day: DayBlueprintDay): number {
  const locationRoleIds = new Set<number>();
  for (const activity of day.activities ?? []) {
    for (const link of activity.activity_locations ?? []) {
      locationRoleIds.add(link.day_blueprint_location_role_id);
    }
  }
  const count = locationRoleIds.size > 0 ? locationRoleIds.size : DEFAULT_LOCATION_COUNT;
  return clampLocationCount(count);
}

export function maxLocationCount(counts: number[]): number {
  if (counts.length === 0) return DEFAULT_LOCATION_COUNT;
  return clampLocationCount(Math.max(...counts));
}
