import type {
  DayBlueprintActivity,
  DayBlueprintDay,
  DayBlueprintMoment,
} from '../../types';
import { parseTimeToMinutes } from '@/shared/ui/PackageTimeline/activity-schedule-helpers';

export const CRITICALITY_META: Record<string, { color: string; label: string }> = {
  REQUIRED: { color: '#ef4444', label: 'Required' },
  RECOMMENDED: { color: '#f59e0b', label: 'Recommended' },
  OPTIONAL: { color: '#64748b', label: 'Optional' },
};

export const CRITICALITY_OPTIONS = ['REQUIRED', 'RECOMMENDED', 'OPTIONAL'];

export function criticalityColor(c?: string | null) {
  return CRITICALITY_META[c ?? 'REQUIRED']?.color ?? '#64748b';
}

export function momentMinutes(m: DayBlueprintMoment): number {
  if (m.duration_seconds != null) return Math.round(m.duration_seconds / 60);
  if (m.expected_duration_minutes != null) return m.expected_duration_minutes;
  return 0;
}

export function activityTotals(a: DayBlueprintActivity) {
  const moments = a.moments ?? [];
  const momentMin = moments.reduce((s, m) => s + momentMinutes(m), 0);
  const planned = a.default_duration_minutes ?? momentMin;
  return { momentCount: moments.length, momentMin, planned };
}

export function formatTimeDisplay(time?: string | null): string {
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) return 'Unscheduled';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

export function formatTimelineHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const normalizedHours = hour % 12 || 12;
  return `${normalizedHours}${ampm}`;
}

export function activityTimelineMinutes(activity: DayBlueprintActivity): number {
  const total = activityTotals(activity);
  return Math.max(activity.default_duration_minutes ?? total.planned ?? 0, 15);
}

export function minutesToClockTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function assignActivityLanes(
  activities: DayBlueprintActivity[],
): Map<number, number> {
  const lanes = new Map<number, number>();
  const laneEnds: number[] = [];
  const timedActivities = activities
    .filter((activity) => parseTimeToMinutes(activity.default_start_time) != null)
    .sort((left, right) => {
      const leftStart = parseTimeToMinutes(left.default_start_time) ?? 0;
      const rightStart = parseTimeToMinutes(right.default_start_time) ?? 0;
      return leftStart - rightStart;
    });

  for (const activity of timedActivities) {
    const start = parseTimeToMinutes(activity.default_start_time);
    if (start == null) continue;
    const end = start + activityTimelineMinutes(activity);
    let placed = false;

    for (let laneIndex = 0; laneIndex < laneEnds.length; laneIndex += 1) {
      if (start >= laneEnds[laneIndex]) {
        lanes.set(activity.id, laneIndex);
        laneEnds[laneIndex] = end;
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes.set(activity.id, laneEnds.length);
      laneEnds.push(end);
    }
  }

  return lanes;
}

export function dayTotals(d: DayBlueprintDay) {
  const activities = d.activities ?? [];
  let moments = 0;
  let minutes = 0;
  for (const a of activities) {
    const t = activityTotals(a);
    moments += t.momentCount;
    minutes += t.planned;
  }
  return { activityCount: activities.length, momentCount: moments, minutes };
}
