import { useMemo } from "react";
import type { SceneSchedule, ScheduleScene } from "../types/schedule-panel.types";
import type { EventDayFilmScene } from "@/features/workflow/scheduling/package-template";
import { parseTimeToMinutes, calculateEndTime, getTotalScheduledMinutes } from "../utils/schedule-helpers";

export function useScheduleStats(
  resolvedScenes: ScheduleScene[],
  scheduleMap: Map<number, SceneSchedule>,
  filmId: number,
  filmName?: string,
) {
  const totalMinutes = useMemo(
    () => getTotalScheduledMinutes(resolvedScenes, scheduleMap),
    [resolvedScenes, scheduleMap],
  );

  const scheduledCount = useMemo(
    () => Array.from(scheduleMap.values()).filter((s) => s.scheduled_start_time).length,
    [scheduleMap],
  );

  const conflictInfo = useMemo(() => {
    const conflicts = new Map<number, { hasConflict: boolean; label?: string }>();
    const byDay = new Map<number, Array<{ sceneId: number; sceneName: string; start: number; end: number }>>();
    for (const scene of resolvedScenes) {
      const sched = scheduleMap.get(scene.id);
      if (!sched?.event_day_template_id || !sched?.scheduled_start_time || !sched?.scheduled_duration_minutes) continue;
      const start = parseTimeToMinutes(sched.scheduled_start_time);
      if (start === null) continue;
      const end = start + sched.scheduled_duration_minutes;
      if (!byDay.has(sched.event_day_template_id)) byDay.set(sched.event_day_template_id, []);
      byDay.get(sched.event_day_template_id)!.push({ sceneId: scene.id, sceneName: scene.name, start, end });
    }
    byDay.forEach((items) => {
      const sorted = [...items].sort((a, b) => a.start - b.start);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start < sorted[i - 1].end) {
          conflicts.set(sorted[i].sceneId, { hasConflict: true, label: sorted[i - 1].sceneName });
          conflicts.set(sorted[i - 1].sceneId, { hasConflict: true, label: sorted[i].sceneName });
        }
      }
    });
    return conflicts;
  }, [resolvedScenes, scheduleMap]);

  const conflictCount = useMemo(
    () => Array.from(conflictInfo.values()).filter((v) => v.hasConflict).length,
    [conflictInfo],
  );

  const crossFilmScenes = useMemo(() => {
    const map = new Map<number, EventDayFilmScene[]>();
    for (const scene of resolvedScenes) {
      const sched = scheduleMap.get(scene.id);
      const dayId = sched?.event_day_template_id;
      if (!dayId) continue;
      if (!map.has(dayId)) map.set(dayId, []);
      map.get(dayId)!.push({
        filmId, filmName: filmName ?? `Film #${filmId}`,
        sceneId: scene.id, sceneName: scene.name, sceneMode: scene.mode,
        startTime: sched?.scheduled_start_time ?? null,
        durationMinutes: sched?.scheduled_duration_minutes ?? null,
        endTime: calculateEndTime(sched?.scheduled_start_time, sched?.scheduled_duration_minutes),
      });
    }
    return map;
  }, [resolvedScenes, scheduleMap, filmId, filmName]);

  return { totalMinutes, scheduledCount, conflictInfo, conflictCount, crossFilmScenes };
}
