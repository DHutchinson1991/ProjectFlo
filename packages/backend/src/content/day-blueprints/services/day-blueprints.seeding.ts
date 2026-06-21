import { type Prisma } from '@prisma/client';
import { type DayBlueprintDefaultsService } from './day-blueprint-defaults.service';

const EVENT_DAY_ROLE_LABELS: Record<string, string> = {
  welcome: 'Welcome Event',
  rehearsal: 'Rehearsal',
  wedding: 'Wedding Day',
  cultural: 'Cultural Ceremony',
  'after-party': 'After Party',
  brunch: 'Brunch',
};

export function normalizeActivityNames(values?: string[]): string[] {
  if (!values?.length) {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, ' ');
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(trimmed);
  }

  return out;
}

function resolveDayName(params: {
  eventCategory: string;
  dayIndex: number;
  roleHint?: string;
}): string {
  const isWedding = params.eventCategory.toLowerCase().includes('wedding');
  const roleHint = params.roleHint?.trim().toLowerCase();
  if (roleHint && EVENT_DAY_ROLE_LABELS[roleHint]) {
    return EVENT_DAY_ROLE_LABELS[roleHint];
  }
  if (isWedding && params.dayIndex === 0) {
    return 'Wedding Day';
  }
  return isWedding ? `Event Day ${params.dayIndex + 1}` : `Day ${params.dayIndex + 1}`;
}

export async function seedInitialVersionStructure(
  tx: Prisma.TransactionClient,
  defaults: DayBlueprintDefaultsService,
  params: {
    brandId: number;
    versionId: number;
    eventCategory: string;
    eventDayCount?: number;
    eventDayRoles?: Record<string, string>;
    activities?: string[];
    dayTimings?: Array<{ day_number: number; default_start_time?: string; default_duration_hours?: number }>;
    activityTimings?: Array<{ name: string; default_start_time?: string; default_duration_minutes?: number; duration_min_minutes?: number; duration_max_minutes?: number }>;
  },
): Promise<void> {
  const activityNames = normalizeActivityNames(params.activities);
  const requestedDayCount = Math.max(params.eventDayCount ?? 0, 0);
  const dayCount = Math.max(requestedDayCount, activityNames.length > 0 ? 1 : 0);

  if (dayCount === 0) {
    return;
  }

  const createdDays: Array<{ id: number }> = [];
  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    const dayTiming = params.dayTimings?.find((timing) => timing.day_number === dayIndex + 1);
    const day = await tx.dayBlueprintDay.create({
      data: {
        day_blueprint_version_id: params.versionId,
        name: resolveDayName({
          eventCategory: params.eventCategory,
          dayIndex,
          roleHint: params.eventDayRoles?.[String(dayIndex + 1)],
        }),
        order_index: dayIndex,
        default_start_time: dayTiming?.default_start_time,
        default_duration_hours: dayTiming?.default_duration_hours,
      },
    });
    createdDays.push(day);
  }

  const primaryDay = createdDays[0];
  for (let orderIndex = 0; orderIndex < activityNames.length; orderIndex += 1) {
    const actName = activityNames[orderIndex];
    const actTiming = params.activityTimings?.find(
      (timing) => timing.name.toLowerCase() === actName.toLowerCase(),
    );
    const activity = await tx.dayBlueprintActivity.create({
      data: {
        day_blueprint_day_id: primaryDay.id,
        name: actName,
        order_index: orderIndex,
        criticality: 'REQUIRED',
        default_start_time: actTiming?.default_start_time,
        default_duration_minutes: actTiming?.default_duration_minutes,
        duration_min_minutes: actTiming?.duration_min_minutes,
        duration_max_minutes: actTiming?.duration_max_minutes,
      },
    });

    await defaults.ensureActivityLocationDefaults(tx, {
      brandId: params.brandId,
      versionId: params.versionId,
      activityId: activity.id,
      activityName: activity.name,
    });
  }
}
