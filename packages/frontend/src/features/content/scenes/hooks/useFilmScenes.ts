import { useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";
import { createScenesApi } from "../api";
import type { ApiClient } from "@/lib/api/api-client.types";
import type { Film } from "@/features/content/films/types";
import type { TimelineScene } from "@/lib/types/timeline";
import { enrichScenesWithBeats } from "@/features/content/scenes/utils/enrichScenesWithBeats";
import { mergeApiScenesIntoLocal, deduplicateScenes } from "@/features/content/scenes/utils/merge-film-scenes";
import { isLogEnabled } from "@/lib/debug/log-flags";

const scenesApi = createScenesApi(apiClient as unknown as ApiClient);

export function useFilmScenes(filmId: number) {
  const shouldLog = isLogEnabled("film");
  const [scenes, setScenes] = useState<TimelineScene[]>([]);
  const filmRef = useRef<Film | null>(null);

  const updateFilmRef = useCallback((film: Film | null) => {
    filmRef.current = film;
  }, []);

  const fetchScenes = useCallback(async (filmData?: Film) => {
    const sourceFilm = filmData || filmRef.current;
    if (!sourceFilm) return;

    if (shouldLog) console.log(`📍 [FETCH-SCENES] Loading scenes for film ${sourceFilm.id}`);

    let localScenes = sourceFilm.scenes || [];
    try {
      const apiScenes = await scenesApi.scenes.getByFilm(sourceFilm.id);
      if (Array.isArray(apiScenes)) {
        localScenes = mergeApiScenesIntoLocal(localScenes, apiScenes);
        if (shouldLog) {
          console.log(`📍 [FETCH-SCENES] Merged montage metadata for ${localScenes.length} scenes`);
        }
      }
    } catch (apiError) {
      if (shouldLog) console.warn(`⚠️ [FETCH-SCENES] Montage merge skipped`, apiError);
    }

    const { unique: dedupedScenes, duplicateIds } = deduplicateScenes(localScenes);
    if (duplicateIds.length > 0 && shouldLog) {
      console.warn(`⚠️ [FETCH-SCENES] Cleaning ${duplicateIds.length} duplicate scenes`);
    }
    for (const dupId of duplicateIds) {
      try { await scenesApi.scenes.delete(dupId); } catch { /* skip */ }
    }

    const timelineScenes = await enrichScenesWithBeats(dedupedScenes);

    const needsReindex = timelineScenes.some((scene, idx) => scene.order_index !== idx);
    if (needsReindex) {
      for (let i = 0; i < timelineScenes.length; i++) {
        const scene = timelineScenes[i];
        if (typeof scene.id === "number") {
          try {
            await scenesApi.scenes.update(scene.id, { order_index: i });
             
            scene.order_index = i;
          } catch { /* skip */ }
        }
      }
    }

    if (shouldLog) console.log(`✅ [FETCH-SCENES] Timeline scenes loaded: ${timelineScenes.length}`);
    setScenes(timelineScenes);
    return timelineScenes;
  }, [filmId]);

  const reconcileScenesTracks = useCallback((tracks: Array<{ id: number; track_type?: string }>) => {
    if (!tracks.length || !scenes.length) return;
    const validTrackIds = new Set(tracks.map((t) => t.id));
    const defaultTrack = tracks.find((t) => t.track_type === "video") || tracks[0];
    if (!defaultTrack) return;

    setScenes((prev) => {
      let changed = false;
      const updated = prev.map((scene) => {
        if (validTrackIds.has(scene.track_id)) return scene;
        changed = true;
        return { ...scene, track_id: defaultTrack.id };
      });
      return changed ? updated : prev;
    });
  }, [scenes]);

  return { scenes, setScenes, fetchScenes, updateFilmRef, reconcileScenesTracks };
}
