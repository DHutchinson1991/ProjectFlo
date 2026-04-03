import { useState, useEffect, useMemo } from "react";
import { scheduleApi } from "@/features/workflow/scheduling/api";
import type {
  EventDay,
  SceneSchedule,
  ScheduleScene,
  ActivityOption,
} from "../types/schedule-panel.types";
import { useScheduleHistory } from "./useScheduleHistory";

interface UseScheduleDataOptions {
  filmId: number;
  scenes: ScheduleScene[];
  brandId?: number;
  mode?: "film" | "package" | "project";
  contextId?: number;
  packageId?: number | null;
}

export function useScheduleData({
  filmId,
  scenes,
  brandId,
  mode = "film",
  contextId,
  packageId,
}: UseScheduleDataOptions) {
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [scheduleMap, setScheduleMap] = useState<Map<number, SceneSchedule>>(new Map());
  const [filmScenes, setFilmScenes] = useState<ScheduleScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const { history, setHistory, future, setFuture, pushHistorySnapshot, handleUndo, handleRedo } =
    useScheduleHistory(scheduleMap, setScheduleMap, setDirty);

  useEffect(() => {
    if (!filmId) return;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (packageId) {
          const days = await scheduleApi.packageEventDays.getAll(packageId);
          if (isMounted) setEventDays(days as unknown as EventDay[]);
        } else if (brandId) {
          const days = await scheduleApi.eventDays.getAll(brandId);
          if (isMounted) setEventDays(days as unknown as EventDay[]);
        }

        if (mode === "package" && packageId) {
          try {
            const acts = await scheduleApi.packageActivities.getAll(packageId);
            if (isMounted) setActivities(acts as ActivityOption[]);
          } catch {
            if (isMounted) setActivities([]);
          }
        }

        if (mode === "film") {
          const filmData = await scheduleApi.film.get(filmId) as { scenes?: Array<{ id: number; schedule?: SceneSchedule }> } | null;
          if (isMounted && filmData?.scenes) {
            setFilmScenes(filmData.scenes as ScheduleScene[]);
            const map = new Map<number, SceneSchedule>();
            for (const scene of filmData.scenes) {
              if (scene.schedule) {
                map.set(scene.id, scene.schedule);
              }
            }
            setScheduleMap(map);
            setHistory([]);
            setFuture([]);
          }
        } else if (mode === "package" && contextId) {
          const pfData = await scheduleApi.packageFilms.getSchedule(contextId) as {
            film?: { scenes?: Array<{ id: number; schedule?: SceneSchedule }> };
            scene_schedules?: Array<{ scene_id: number; [key: string]: unknown }>;
          } | null;
          if (isMounted && pfData?.film?.scenes) {
            setFilmScenes(pfData.film.scenes as ScheduleScene[]);
            const map = new Map<number, SceneSchedule>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const overrideMap = new Map<number, any>();
            for (const override of (pfData.scene_schedules ?? [])) {
              overrideMap.set(override.scene_id, override);
            }
            for (const scene of pfData.film.scenes) {
              const override = overrideMap.get(scene.id);
              const filmDefault = scene.schedule;
              if (override) {
                map.set(scene.id, override);
              } else if (filmDefault) {
                map.set(scene.id, filmDefault);
              }
            }
            setScheduleMap(map);
            setHistory([]);
            setFuture([]);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load schedule");
          console.error("Failed to load schedule:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [filmId, brandId, mode, contextId, packageId]);

  const resolvedScenes = useMemo(
    () => (filmScenes.length > 0 ? filmScenes : scenes),
    [filmScenes, scenes]
  );

  const orderedScenes = useMemo(
    () => [...resolvedScenes].sort((a, b) => a.order_index - b.order_index),
    [resolvedScenes]
  );

  return {
    eventDays,
    setEventDays,
    scheduleMap,
    setScheduleMap,
    filmScenes,
    setFilmScenes,
    loading,
    error,
    setError,
    dirty,
    setDirty,
    activities,
    history,
    future,
    resolvedScenes,
    orderedScenes,
    pushHistorySnapshot,
    handleUndo,
    handleRedo,
  };
}
