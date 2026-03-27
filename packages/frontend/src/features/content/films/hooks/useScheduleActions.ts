"use client";

import { useState, useCallback } from "react";
import { filmsApi } from "../api";
import { scheduleApi } from "@/features/workflow/scheduling/api";
import type { SceneSchedule, ScheduleScene, ActivityOption, UseScheduleActionsParams } from "../types/schedule-panel.types";
import { calculateEndTime, parseTimeToMinutes, addMinutesToTime } from "../utils/schedule-helpers";

export function useScheduleActions({
  filmId, mode, contextId, orderedScenes, scheduleMap, setScheduleMap,
  filmScenes, setFilmScenes, setDirty, setError, pushHistorySnapshot, onScheduleChange,
}: UseScheduleActionsParams) {
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [rippleEnabled, setRippleEnabled] = useState(true);
  const [lockedScenes, setLockedScenes] = useState<Set<number>>(new Set());
  const [creatingSceneForActivity, setCreatingSceneForActivity] = useState<number | null>(null);

  const handleSceneScheduleChange = useCallback(
    (sceneId: number, updates: Partial<SceneSchedule>) => {
      setScheduleMap((prev) => {
        pushHistorySnapshot(prev);
        const next = new Map(prev);
        const existing = next.get(sceneId) || { scene_id: sceneId };
        const before = { ...existing } as SceneSchedule;
        const after = { ...existing, ...updates } as SceneSchedule;
        next.set(sceneId, after);

        if (
          rippleEnabled && !lockedScenes.has(sceneId)
          && (Object.prototype.hasOwnProperty.call(updates, "scheduled_duration_minutes")
            || Object.prototype.hasOwnProperty.call(updates, "scheduled_start_time"))
        ) {
          const dayId = after.event_day_template_id ?? before.event_day_template_id;
          const oldEndMins = parseTimeToMinutes(calculateEndTime(before.scheduled_start_time, before.scheduled_duration_minutes));
          const newEndMins = parseTimeToMinutes(calculateEndTime(after.scheduled_start_time, after.scheduled_duration_minutes));
          if (dayId && oldEndMins !== null && newEndMins !== null && oldEndMins !== newEndMins) {
            const delta = newEndMins - oldEndMins;
            const sceneIdx = orderedScenes.findIndex((s) => s.id === sceneId);
            for (let i = sceneIdx + 1; i < orderedScenes.length; i++) {
              const candidate = orderedScenes[i];
              if (lockedScenes.has(candidate.id)) continue;
              const candidateSched = next.get(candidate.id);
              if (!candidateSched || candidateSched.event_day_template_id !== dayId) continue;
              const shifted = addMinutesToTime(candidateSched.scheduled_start_time, delta);
              if (shifted) next.set(candidate.id, { ...candidateSched, scheduled_start_time: shifted });
            }
          }
        }
        return next;
      });
      setDirty(true);
    },
    [orderedScenes, lockedScenes, rippleEnabled, pushHistorySnapshot, setScheduleMap, setDirty],
  );

  const handleToggleLock = useCallback((sceneId: number) => {
    setLockedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId); else next.add(sceneId);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((sceneId: number) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId); else next.add(sceneId);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const schedules = Array.from(scheduleMap.values()).map((s) => ({
        scene_id: s.scene_id,
        event_day_template_id: s.event_day_template_id ?? null,
        scheduled_start_time: s.scheduled_start_time ?? null,
        scheduled_duration_minutes: s.scheduled_duration_minutes ?? null,
        moment_schedules: s.moment_schedules ?? null,
        beat_schedules: s.beat_schedules ?? null,
        notes: s.notes ?? null,
        package_activity_id: s.package_activity_id ?? null,
      }));
      if (mode === "film") await scheduleApi.film.bulkUpsertScenes(filmId, schedules);
      else if (mode === "package" && contextId) await scheduleApi.packageFilms.bulkUpsertSceneSchedules(contextId, schedules);
      else if (mode === "project" && contextId) await scheduleApi.projectFilms.bulkUpsertSceneSchedules(contextId, schedules);
      setDirty(false);
      onScheduleChange?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }, [filmId, mode, contextId, scheduleMap, onScheduleChange]);

  const handleCreateSceneFromActivity = useCallback(async (activity: ActivityOption) => {
    if (!filmId || !contextId || mode !== "package") return;
    setCreatingSceneForActivity(activity.id);
    try {
      const newScene = await filmsApi.localScenes.create(filmId, { name: activity.name });
      const startMin = activity.start_time ? parseTimeToMinutes(activity.start_time) : null;
      const endMin = activity.end_time ? parseTimeToMinutes(activity.end_time) : null;
      const dur = startMin !== null && endMin !== null && endMin > startMin ? endMin - startMin : null;
      const payload = {
        scene_id: newScene.id, event_day_template_id: activity.package_event_day_id ?? null,
        package_activity_id: activity.id, scheduled_start_time: activity.start_time ?? null,
        scheduled_duration_minutes: dur, moment_schedules: null, beat_schedules: null, notes: null,
      };
      await scheduleApi.packageFilms.upsertSceneSchedule(contextId, payload);
      /* eslint-disable @typescript-eslint/no-explicit-any -- API response includes mode/duration_seconds not in FilmLocalScene type */
      const sceneEntry: ScheduleScene = {
        id: newScene.id, name: newScene.name,
        mode: (newScene as any).mode ?? "MOMENTS",
        order_index: newScene.order_index ?? filmScenes.length,
        duration_seconds: (newScene as any).duration_seconds ?? null, moments: [], beats: [],
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */
      setFilmScenes((prev) => [...prev, sceneEntry]);
      setScheduleMap((prev) => {
        const next = new Map(prev);
        next.set(newScene.id, {
          scene_id: newScene.id, event_day_template_id: payload.event_day_template_id,
          package_activity_id: activity.id, scheduled_start_time: payload.scheduled_start_time,
          scheduled_duration_minutes: payload.scheduled_duration_minutes,
        });
        return next;
      });
      onScheduleChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scene");
    } finally {
      setCreatingSceneForActivity(null);
    }
  }, [filmId, contextId, mode, filmScenes.length, onScheduleChange]);

  return {
    expandedScenes, saving, rippleEnabled, setRippleEnabled,
    lockedScenes, creatingSceneForActivity,
    handleSceneScheduleChange, handleToggleLock, toggleExpand,
    handleSave, handleCreateSceneFromActivity,
  };
}
