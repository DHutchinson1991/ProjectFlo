import { useState, useCallback, useRef, useEffect } from "react";
import { api, apiClient } from "@/lib/api";
import { createScenesApi } from "@/lib/api/scenes.api";
import type { ApiClient } from "@/lib/api/api-client.types";
import type { Film } from "@/lib/types/domains/film";
import type { TimelineScene, TimelineTrack } from "@/lib/types/timeline";
import { transformFilmMomentsTimeline } from "@/lib/utils/momentTransform";
import { transformBackendTrack } from "@/lib/utils/trackUtils";
import { getSceneColorByType } from "@/app/(studio)/designer/components/ContentBuilder/utils/colorUtils";
import { enrichScenesWithBeats } from "./enrichScenesWithBeats";
import { isLogEnabled } from "@/lib/debug/log-flags";

interface FilmWithMomentsTimeline {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    local_scenes: any[];
}

/**
 * Hook to fetch and manage film data with all related entities
 * Fetches film, scenes, tracks, and timeline layers
 */
export const useFilmData = (filmId: number) => {
    const shouldLog = isLogEnabled("film");
    const scenesApi = createScenesApi(apiClient as unknown as ApiClient);
    const [film, setFilm] = useState<Film | null>(null);
    const [scenes, setScenes] = useState<TimelineScene[]>([]);
    const [tracks, setTracks] = useState<any[]>([]);
    const [layers, setLayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Use ref to store current film to avoid dependency issues
    const filmRef = useRef<Film | null>(null);
    
    // Sync filmRef with film state
    useEffect(() => {
        filmRef.current = film;
    }, [film]);

    /**
     * Fetch film details
     */
    const fetchFilm = useCallback(async () => {
        try {
            const data = await api.films.getById(filmId);
            if (shouldLog) {
                console.log(`📍 [FETCH-FILM] Loaded film:`, { id: data.id, name: data.name, sceneCount: (data as any).scenes?.length || 0 });
            }
            setFilm(data);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch film";
            setError(errorMessage);
            throw err;
        }
    }, [filmId]);

    /**
     * Fetch and transform film scenes with moments
     */
    const fetchScenes = useCallback(async (filmData?: Film) => {
        try {
            const sourceFilm = filmData || filmRef.current;
            if (!sourceFilm) return;

            if (shouldLog) {
                console.log(`📍 [FETCH-SCENES] Loading scenes for film ${sourceFilm.id}`);
            }
            
            let localScenes = sourceFilm.scenes || [];
            try {
                const apiScenes = await api.scenes.getByFilm(sourceFilm.id);
                if (Array.isArray(apiScenes)) {
                    const apiById = new Map(apiScenes.map((scene: any) => [scene.id, scene]));
                    localScenes = localScenes.map((scene: any) => {
                        const apiScene: any = apiById.get(scene.id);
                        if (!apiScene) return scene;
                        // Merge moments: prefer API moments but preserve moment_music from film data when API lacks it
                        let mergedMoments: any[];
                        if (Array.isArray(apiScene.moments) && apiScene.moments.length > 0) {
                            const filmMomentsById = new Map<number, any>(
                                (Array.isArray(scene.moments) ? scene.moments : []).map((m: any) => [m.id, m])
                            );
                            mergedMoments = apiScene.moments.map((apiMoment: Record<string, any>) => {
                                const filmMoment = filmMomentsById.get(apiMoment.id);
                                return {
                                    ...apiMoment,
                                    // Preserve moment_music: prefer API data, fall back to film data
                                    moment_music: apiMoment.moment_music ?? filmMoment?.moment_music ?? null,
                                };
                            });
                        } else {
                            mergedMoments = Array.isArray(scene.moments) && scene.moments.length > 0 ? scene.moments : [];
                        }

                        return {
                            ...scene,
                            shot_count: apiScene.shot_count ?? scene.shot_count ?? null,
                            duration_seconds: apiScene.duration_seconds ?? scene.duration_seconds ?? null,
                            beats: Array.isArray(apiScene.beats) ? apiScene.beats : (scene as any).beats ?? [],
                            // 🔥 Merge moments from API so enrichment sees them and creates MOMENTS_CONTAINER
                            moments: mergedMoments,
                            // Merge scene recording setup
                            recording_setup: apiScene.recording_setup ?? (scene as any).recording_setup ?? null,
                            // Preserve scene_music: prefer API data, fall back to film data
                            scene_music: apiScene.scene_music ?? scene.scene_music ?? null,
                        };
                    });
                    if (shouldLog) {
                        console.log(`📍 [FETCH-SCENES] Merged montage metadata from scenes API for ${localScenes.length} scenes`);
                        console.log(`📍 [FETCH-SCENES] Montage fields after merge:`, localScenes.map((scene: any) => ({
                            id: scene.id,
                            name: scene.name,
                            scene_template_id: scene.scene_template_id ?? null,
                            shot_count: scene.shot_count ?? null,
                            duration_seconds: scene.duration_seconds ?? null,
                            momentsCount: scene.moments?.length || 0,
                        })));
                    }
                }
            } catch (apiError) {
                if (shouldLog) {
                    console.warn(`⚠️ [FETCH-SCENES] Montage merge skipped (scenes API failed)`, apiError);
                }
            }

            // 🔥 Deduplicate scenes that share the same template/name (legacy duplicates)
            const seenSceneKeys = new Map<string, number>();
            const dedupedScenes: any[] = [];
            const duplicateSceneIds: number[] = [];

            for (const scene of localScenes) {
                const key = `${scene.scene_template_id ?? 'na'}|${scene.name ?? 'na'}`;
                if (!seenSceneKeys.has(key)) {
                    seenSceneKeys.set(key, scene.id);
                    dedupedScenes.push(scene);
                } else {
                    duplicateSceneIds.push(scene.id);
                }
            }

            if (duplicateSceneIds.length > 0) {
                if (shouldLog) {
                    console.warn(`⚠️ [FETCH-SCENES] Detected duplicate scenes (${duplicateSceneIds.length}). Cleaning up duplicates...`, duplicateSceneIds);
                }
                for (const duplicateId of duplicateSceneIds) {
                    try {
                        await scenesApi.scenes.delete(duplicateId);
                        if (shouldLog) {
                            console.log(`✅ [FETCH-SCENES] Deleted duplicate scene ${duplicateId}`);
                        }
                    } catch (deleteError) {
                        console.error(`❌ [FETCH-SCENES] Failed to delete duplicate scene ${duplicateId}:`, deleteError);
                    }
                }
            }

            // Enrich scenes with moments from templates
            const timelineScenes = await enrichScenesWithBeats(dedupedScenes);

            // 🔥 Ensure order_index is sequential and persisted in DB
            const needsReindex = timelineScenes.some((scene, index) => scene.order_index !== index);
            if (needsReindex) {
                if (shouldLog) {
                    console.warn(`⚠️ [FETCH-SCENES] Detected non-sequential order_index. Reindexing ${timelineScenes.length} scenes...`);
                }
                for (let index = 0; index < timelineScenes.length; index++) {
                    const scene = timelineScenes[index];
                    if (typeof scene.id === 'number') {
                        try {
                            await scenesApi.scenes.update(scene.id, { order_index: index });
                            (scene as any).order_index = index;
                        } catch (reindexError) {
                            console.error(`❌ [FETCH-SCENES] Failed to update order_index for scene ${scene.id}:`, reindexError);
                        }
                    }
                }
            }

            if (shouldLog) {
                console.log(`✅ [FETCH-SCENES] Timeline scenes loaded: ${timelineScenes.length}`);
            }
            setScenes(timelineScenes);
            return timelineScenes;
        } catch (err) {
            console.error("❌ [FETCH-SCENES] Failed to fetch film scenes:", err);
            throw err;
        }
    }, [filmId]);

    /**
     * Fetch timeline tracks
     */
    const fetchTracks = useCallback(async () => {
        try {
            let tracksData = await api.films.tracks.getAll(filmId);

            if (!tracksData || tracksData.length === 0) {
                try {
                    tracksData = await api.films.tracks.generate(filmId, { overwrite: true });
                } catch (generateError) {
                    console.error('Failed to generate tracks:', generateError);
                    tracksData = [];
                }
            }
            
            // Convert backend tracks to TimelineTrack format
            const timelineTracks = tracksData.map((track: any) => transformBackendTrack(track))
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            
            setTracks(timelineTracks);
            return timelineTracks;
        } catch (err) {
            console.error("Failed to load tracks:", err);
            throw err;
        }
    }, [filmId]);

    /**
     * Fetch timeline layers
     */
    const fetchLayers = useCallback(async () => {
        try {
            const layersData = await api.timeline.getLayers();
            setLayers(layersData || []);
            return layersData;
        } catch (err) {
            console.error("Failed to load timeline layers:", err);
            throw err;
        }
    }, []);

    /**
     * Load all film data
     */
    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const filmData = await fetchFilm();
            if (filmData) {
                await Promise.all([
                    fetchScenes(filmData),
                    fetchTracks(),
                    fetchLayers(),
                ]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load film data";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [fetchFilm, fetchScenes, fetchTracks, fetchLayers]);

    /**
     * Refresh scenes — re-fetches film first to pick up newly added scenes/moments
     */
    const refreshScenes = useCallback(async () => {
        try {
            const freshFilm = await fetchFilm();
            if (freshFilm) {
                await fetchScenes(freshFilm);
            } else {
                await fetchScenes();
            }
        } catch {
            await fetchScenes();
        }
    }, [fetchFilm, fetchScenes]);

    /**
     * Refresh tracks only
     */
    const refreshTracks = useCallback(async () => {
        await fetchTracks();
    }, [fetchTracks]);

    /**
     * Ensure scenes reference valid track IDs after tracks load
     */
    useEffect(() => {
        if (!tracks || tracks.length === 0 || !scenes || scenes.length === 0) return;

        const validTrackIds = new Set(tracks.map(t => t.id));
        const defaultVideoTrack = tracks.find(t => t.track_type === "video") || tracks[0];

        if (!defaultVideoTrack) return;

        setScenes(prev => {
            let changed = false;
            const updated = prev.map(scene => {
                if (validTrackIds.has(scene.track_id)) {
                    return scene;
                }
                changed = true;
                return {
                    ...scene,
                    track_id: defaultVideoTrack.id,
                };
            });

            return changed ? updated : prev;
        });
    }, [tracks, scenes, setScenes]);

    return {
        film,
        scenes,
        tracks,
        layers,
        loading,
        error,
        setFilm,
        setScenes,
        setTracks,
        loadAll,
        refreshScenes,
        refreshTracks,
    };
};
