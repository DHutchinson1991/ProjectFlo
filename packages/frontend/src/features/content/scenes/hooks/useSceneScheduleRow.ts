"use client";

import React, { useMemo, useCallback } from "react";
import type {
  SceneSchedule, ScheduleScene, EventDay, ActivityOption,
} from "@/features/content/films/types/schedule-panel.types";
import { calculateEndTime, parseTimeToMinutes, addMinutesToTime } from "@/features/content/films/utils/schedule-helpers";

interface UseSceneScheduleRowParams {
  scene: ScheduleScene;
  schedule: SceneSchedule | null;
  eventDays: EventDay[];
  onChange: (sceneId: number, updates: Partial<SceneSchedule>) => void;
  readOnly: boolean;
  suggestedStart?: string | null;
  activities: ActivityOption[];
}

export function useSceneScheduleRow({
  scene, schedule, eventDays, onChange, readOnly, suggestedStart, activities,
}: UseSceneScheduleRowParams) {
  const endTime = calculateEndTime(schedule?.scheduled_start_time, schedule?.scheduled_duration_minutes);
  const eventDayName = eventDays.find((ed) => ed.id === schedule?.event_day_template_id)?.name ?? null;
  const assignedActivity = activities.find((a) => a.id === schedule?.package_activity_id) ?? null;

  const availableActivities = useMemo(() => {
    if (!schedule?.event_day_template_id || activities.length === 0) return activities;
    return activities.filter(
      (a) => a.package_event_day_id === schedule.event_day_template_id || a.id === schedule?.package_activity_id,
    );
  }, [activities, schedule?.event_day_template_id, schedule?.package_activity_id]);

  React.useEffect(() => {
    if (eventDays.length === 1 && !schedule?.event_day_template_id && !readOnly) {
      onChange(scene.id, { event_day_template_id: eventDays[0].id });
    }
  }, [eventDays, schedule?.event_day_template_id, readOnly, scene.id, onChange]);

  const status: "scheduled" | "missing-time" | "no-day" =
    schedule?.event_day_template_id && schedule?.scheduled_start_time
      ? "scheduled"
      : schedule?.event_day_template_id ? "missing-time" : "no-day";

  const handleTimeChange = useCallback(
    (value: string) => onChange(scene.id, { scheduled_start_time: value || null }), [scene.id, onChange],
  );
  const handleDurationChange = useCallback(
    (value: string) => { const m = parseInt(value, 10); onChange(scene.id, { scheduled_duration_minutes: isNaN(m) ? null : m }); },
    [scene.id, onChange],
  );
  const handleEventDayChange = useCallback(
    (value: string) => onChange(scene.id, { event_day_template_id: value ? parseInt(value, 10) : null }),
    [scene.id, onChange],
  );
  const applyQuickShift = useCallback(
    (delta: number) => { const next = addMinutesToTime(schedule?.scheduled_start_time, delta); if (next) onChange(scene.id, { scheduled_start_time: next }); },
    [scene.id, schedule?.scheduled_start_time, onChange],
  );
  const applySuggestedStart = useCallback(
    () => { if (suggestedStart) onChange(scene.id, { scheduled_start_time: suggestedStart }); },
    [scene.id, suggestedStart, onChange],
  );

  const autoDistributeChildren = useCallback(() => {
    const startMins = parseTimeToMinutes(schedule?.scheduled_start_time);
    const totalDuration = schedule?.scheduled_duration_minutes;
    if (startMins === null || !totalDuration || totalDuration <= 0) return;
    const items = scene.mode === "MOMENTS" ? scene.moments : scene.mode === "MONTAGE" ? scene.beats : null;
    if (!items || items.length === 0) return;
    const sorted = [...items].sort((a, b) => a.order_index - b.order_index);
    const each = Math.floor(totalDuration / sorted.length);
    const remainder = totalDuration % sorted.length;
    let cursor = startMins;
    const schedules = sorted.map((item, idx) => {
      const dur = each + (idx < remainder ? 1 : 0);
      const h = Math.floor(cursor / 60) % 24;
      const m = cursor % 60;
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      cursor += dur;
      const idKey = scene.mode === "MOMENTS" ? "moment_id" : "beat_id";
      return { [idKey]: item.id, start_time: start, duration_minutes: dur };
    });
    const field = scene.mode === "MOMENTS" ? "moment_schedules" : "beat_schedules";
    onChange(scene.id, { [field]: schedules });
  }, [scene, schedule, onChange]);

  const handleChildScheduleChange = useCallback(
    (childId: number, kind: "moment" | "beat", field: "start_time" | "duration_minutes", value: string) => {
      const key = kind === "moment" ? "moment_schedules" : "beat_schedules";
      const idField = kind === "moment" ? "moment_id" : "beat_id";
      const current = Array.isArray(schedule?.[key]) ? [...(schedule![key] as unknown as Array<Record<string, unknown>>)] : [];
      const idx = current.findIndex((c) => c[idField] === childId);
      const parsed = field === "duration_minutes" ? (parseInt(value, 10) || null) : (value || null);
      if (idx >= 0) {
        current[idx] = { ...current[idx], [field]: parsed };
      } else {
        current.push({ [idField]: childId, start_time: field === "start_time" ? parsed : null, duration_minutes: field === "duration_minutes" ? parsed : null });
      }
      onChange(scene.id, { [key]: current });
    },
    [scene.id, schedule, onChange],
  );

  const getChildSchedule = useCallback(
    (childId: number, kind: "moment" | "beat") => {
      const key = kind === "moment" ? "moment_schedules" : "beat_schedules";
      const idField = kind === "moment" ? "moment_id" : "beat_id";
      const list = schedule?.[key];
      if (!Array.isArray(list)) return undefined;
      return (list as unknown as Array<Record<string, unknown>>).find((c) => c[idField] === childId);
    },
    [schedule],
  );

  return {
    endTime, eventDayName, assignedActivity, availableActivities, status,
    handleTimeChange, handleDurationChange, handleEventDayChange,
    applyQuickShift, applySuggestedStart, autoDistributeChildren,
    handleChildScheduleChange, getChildSchedule,
  };
}
