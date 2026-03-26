import type { SceneSchedule, ScheduleScene } from "../types/schedule-panel.types";

export function formatScheduleDuration(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function calculateEndTime(
  startTime: string | null | undefined,
  durationMinutes: number | null | undefined,
): string | null {
  if (!startTime || !durationMinutes) return null;
  const [hours, minutes] = startTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

export function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function addMinutesToTime(
  time: string | null | undefined,
  deltaMinutes: number,
): string | null {
  const mins = parseTimeToMinutes(time);
  if (mins === null) return null;
  const total = ((mins + deltaMinutes) % (24 * 60) + (24 * 60)) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function cloneScheduleMap(
  input: Map<number, SceneSchedule>,
): Map<number, SceneSchedule> {
  const cloned = new Map<number, SceneSchedule>();
  input.forEach((value, key) => {
    cloned.set(key, {
      ...value,
      moment_schedules: value.moment_schedules
        ? [...value.moment_schedules]
        : value.moment_schedules,
      beat_schedules: value.beat_schedules
        ? [...value.beat_schedules]
        : value.beat_schedules,
    });
  });
  return cloned;
}

export function suggestNextStartTime(
  eventDayId: number | null | undefined,
  scenes: ScheduleScene[],
  scheduleMap: Map<number, SceneSchedule>,
  excludeSceneId?: number,
): string | null {
  if (!eventDayId) return null;
  let latestEnd: string | null = null;
  for (const scene of scenes) {
    if (scene.id === excludeSceneId) continue;
    const sched = scheduleMap.get(scene.id);
    if (
      sched?.event_day_template_id === eventDayId &&
      sched.scheduled_start_time &&
      sched.scheduled_duration_minutes
    ) {
      const end = calculateEndTime(
        sched.scheduled_start_time,
        sched.scheduled_duration_minutes,
      );
      if (end && (!latestEnd || end > latestEnd)) {
        latestEnd = end;
      }
    }
  }
  return latestEnd;
}

export function getTotalScheduledMinutes(
  scenes: ScheduleScene[],
  scheduleMap: Map<number, SceneSchedule>,
): number {
  let total = 0;
  for (const scene of scenes) {
    const sched = scheduleMap.get(scene.id);
    if (sched?.scheduled_duration_minutes) {
      total += sched.scheduled_duration_minutes;
    }
  }
  return total;
}
