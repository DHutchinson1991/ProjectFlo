"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────

export interface EventDayTemplate {
  id: number;
  name: string;
  description?: string | null;
  order_index: number;
  is_active?: boolean;
}

export interface MomentScheduleItem {
  moment_id: number;
  start_time: string | null;
  duration_minutes: number | null;
}

export interface BeatScheduleItem {
  beat_id: number;
  start_time: string | null;
  duration_minutes: number | null;
}

export interface SceneScheduleData {
  id?: number;
  scene_id: number;
  event_day_template_id?: number | null;
  package_activity_id?: number | null;
  scheduled_start_time?: string | null;
  scheduled_duration_minutes?: number | null;
  moment_schedules?: MomentScheduleItem[] | null;
  beat_schedules?: BeatScheduleItem[] | null;
  notes?: string | null;
  order_index?: number;
  event_day?: EventDayTemplate | null;
}

// ─── Hook ───────────────────────────────────────────────────────────────

/**
 * useFilmSchedule - Shared hook for accessing film schedule data.
 *
 * Provides schedule data (event days, scene schedules, moment/beat schedules)
 * and methods to update them. Used by FilmSchedulePanel and ContentBuilder
 * editors (MomentEditor, BeatEditor, SceneRecordingSetup, CreateScene).
 *
 * @param filmId    - The film ID to load schedules for
 * @param brandId   - The brand ID for event day templates
 * @param packageId - Optional package context; when provided, saves use
 *                    PackageFilmSceneSchedule (which supports package_activity_id)
 */
export function useFilmSchedule(
  filmId: number | null | undefined,
  brandId: number | null | undefined,
  packageId?: number | null | undefined,
) {
  const [eventDays, setEventDays] = useState<EventDayTemplate[]>([]);
  const [scheduleMap, setScheduleMap] = useState<Map<number, SceneScheduleData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);
  // Tracks the resolved packageFilmId when a packageId is provided
  const packageFilmIdRef = useRef<number | null>(null);

  // Load schedule data
  useEffect(() => {
    const key = `${filmId}-${brandId}-${packageId ?? 0}`;
    if (!filmId || loadedRef.current === key) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      packageFilmIdRef.current = null;
      try {
        // Load event day templates
        if (brandId) {
          const days = await api.schedule.eventDays.getAll(brandId);
          if (mounted) setEventDays(days);
        }

        // When a packageId is provided, load the package-specific scene schedules
        // (PackageFilmSceneSchedule supports package_activity_id)
        if (packageId) {
          const packageFilms = await api.schedule.packageFilms.getAll(packageId);
          const matchingPF = (packageFilms || []).find((pf: any) => pf.film_id === filmId);
          if (matchingPF) {
            packageFilmIdRef.current = matchingPF.id;
            const pfData = await api.schedule.packageFilms.getSchedule(matchingPF.id);
            if (mounted && pfData?.scene_schedules) {
              const map = new Map<number, SceneScheduleData>();
              for (const sched of pfData.scene_schedules) {
                map.set(sched.scene_id, sched);
              }
              setScheduleMap(map);
              loadedRef.current = key;
              return;
            }
          }
        }

        // Fallback: load base film schedule (no package_activity_id)
        const filmData = await api.schedule.film.get(filmId);
        if (mounted && filmData?.scenes) {
          const map = new Map<number, SceneScheduleData>();
          for (const scene of filmData.scenes) {
            if (scene.schedule) {
              map.set(scene.id, scene.schedule);
            }
          }
          setScheduleMap(map);
          loadedRef.current = key;
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load schedule");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [filmId, brandId, packageId]);

  // ─── Scene-level schedule ──────────────────────────────────────────

  /** Get schedule data for a scene */
  const getSceneSchedule = useCallback(
    (sceneId: number): SceneScheduleData | undefined => scheduleMap.get(sceneId),
    [scheduleMap]
  );

  /** Update scene schedule locally (for optimistic UI) */
  const updateSceneSchedule = useCallback(
    (sceneId: number, updates: Partial<SceneScheduleData>) => {
      setScheduleMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(sceneId) || { scene_id: sceneId };
        next.set(sceneId, { ...existing, ...updates });
        return next;
      });
    },
    []
  );

  /** Save a scene schedule to the API */
  const saveSceneSchedule = useCallback(
    async (sceneId: number) => {
      if (!filmId) return;
      const sched = scheduleMap.get(sceneId);
      if (!sched) return;

      try {
        const packageFilmId = packageFilmIdRef.current;
        if (packageFilmId) {
          // In package context: save to PackageFilmSceneSchedule (supports package_activity_id)
          await api.schedule.packageFilms.upsertSceneSchedule(packageFilmId, {
            scene_id: sceneId,
            event_day_template_id: sched.event_day_template_id ?? null,
            package_activity_id: sched.package_activity_id ?? null,
            scheduled_start_time: sched.scheduled_start_time ?? null,
            scheduled_duration_minutes: sched.scheduled_duration_minutes ?? null,
            moment_schedules: sched.moment_schedules ?? null,
            beat_schedules: sched.beat_schedules ?? null,
            notes: sched.notes ?? null,
          });
        } else {
          // Standalone film context: save to base FilmSceneSchedule
          await api.schedule.film.upsertScene(filmId, {
            scene_id: sceneId,
            event_day_template_id: sched.event_day_template_id ?? null,
            scheduled_start_time: sched.scheduled_start_time ?? null,
            scheduled_duration_minutes: sched.scheduled_duration_minutes ?? null,
            moment_schedules: sched.moment_schedules ?? null,
            beat_schedules: sched.beat_schedules ?? null,
            notes: sched.notes ?? null,
          });
        }
      } catch (err: unknown) {
        console.error("Failed to save scene schedule:", err);
        throw err;
      }
    },
    [filmId, scheduleMap]
  );

  // ─── Moment-level schedule ─────────────────────────────────────────

  /** Get moment schedule item from a scene's moment_schedules JSON */
  const getMomentSchedule = useCallback(
    (sceneId: number, momentId: number): MomentScheduleItem | undefined => {
      const sched = scheduleMap.get(sceneId);
      if (!sched?.moment_schedules) return undefined;
      return (sched.moment_schedules as MomentScheduleItem[]).find(
        (m) => m.moment_id === momentId
      );
    },
    [scheduleMap]
  );

  /** Update a single moment's schedule within a scene */
  const updateMomentSchedule = useCallback(
    (sceneId: number, momentId: number, field: "start_time" | "duration_minutes", value: string | number | null) => {
      setScheduleMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(sceneId) || { scene_id: sceneId };
        const moments: MomentScheduleItem[] = Array.isArray(existing.moment_schedules)
          ? [...(existing.moment_schedules as MomentScheduleItem[])]
          : [];

        const idx = moments.findIndex((m) => m.moment_id === momentId);
        if (idx >= 0) {
          moments[idx] = { ...moments[idx], [field]: value };
        } else {
          moments.push({
            moment_id: momentId,
            start_time: field === "start_time" ? (value as string) : null,
            duration_minutes: field === "duration_minutes" ? (value as number) : null,
          });
        }

        next.set(sceneId, { ...existing, moment_schedules: moments });
        return next;
      });
    },
    []
  );

  // ─── Beat-level schedule ───────────────────────────────────────────

  /** Get beat schedule item from a scene's beat_schedules JSON */
  const getBeatSchedule = useCallback(
    (sceneId: number, beatId: number): BeatScheduleItem | undefined => {
      const sched = scheduleMap.get(sceneId);
      if (!sched?.beat_schedules) return undefined;
      return (sched.beat_schedules as BeatScheduleItem[]).find(
        (b) => b.beat_id === beatId
      );
    },
    [scheduleMap]
  );

  /** Update a single beat's schedule within a scene */
  const updateBeatSchedule = useCallback(
    (sceneId: number, beatId: number, field: "start_time" | "duration_minutes", value: string | number | null) => {
      setScheduleMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(sceneId) || { scene_id: sceneId };
        const beats: BeatScheduleItem[] = Array.isArray(existing.beat_schedules)
          ? [...(existing.beat_schedules as BeatScheduleItem[])]
          : [];

        const idx = beats.findIndex((b) => b.beat_id === beatId);
        if (idx >= 0) {
          beats[idx] = { ...beats[idx], [field]: value };
        } else {
          beats.push({
            beat_id: beatId,
            start_time: field === "start_time" ? (value as string) : null,
            duration_minutes: field === "duration_minutes" ? (value as number) : null,
          });
        }

        next.set(sceneId, { ...existing, beat_schedules: beats });
        return next;
      });
    },
    []
  );

  // ─── Refresh ───────────────────────────────────────────────────────

  /** Force reload schedule data */
  const refresh = useCallback(() => {
    loadedRef.current = null;
    // Trigger re-load by forcing a state change
    setScheduleMap(new Map());
  }, []);

  return {
    // Data
    eventDays,
    scheduleMap,
    loading,
    error,

    // Scene-level
    getSceneSchedule,
    updateSceneSchedule,
    saveSceneSchedule,

    // Moment-level
    getMomentSchedule,
    updateMomentSchedule,

    // Beat-level
    getBeatSchedule,
    updateBeatSchedule,

    // Utils
    refresh,
  };
}
