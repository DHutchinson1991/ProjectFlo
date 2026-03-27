import { useState, useCallback, useEffect } from "react";
import { filmsApi } from "../api";
import type { Film } from "@/features/content/films/types";
import type { TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { transformBackendTrack } from "@/features/content/films/utils/trackUtils";
import { isLogEnabled } from "@/shared/debug/log-flags";
import { useFilmScenes } from "@/features/content/scenes/hooks/useFilmScenes";

/**
 * Hook to fetch and manage film data with all related entities.
 * Composes useFilmScenes for scene-specific logic.
 */
export const useFilmData = (filmId: number) => {
    const shouldLog = isLogEnabled("film");
    const [film, setFilm] = useState<Film | null>(null);
    const [tracks, setTracks] = useState<TimelineTrack[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [layers, setLayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { scenes, setScenes, fetchScenes, updateFilmRef, reconcileScenesTracks } = useFilmScenes(filmId);

    // Keep scene hook's film ref in sync
    useEffect(() => { updateFilmRef(film); }, [film, updateFilmRef]);

    const fetchFilm = useCallback(async () => {
        try {
            const data = await filmsApi.films.getById(filmId);
            if (shouldLog) {
                console.log(`📍 [FETCH-FILM] Loaded film:`, { id: data.id, name: data.name });
            }
            setFilm(data);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch film";
            setError(errorMessage);
            throw err;
        }
    }, [filmId]);

    const fetchTracks = useCallback(async () => {
        try {
            let tracksData = await filmsApi.tracks.getAll(filmId);
            if (!tracksData || tracksData.length === 0) {
                try {
                    tracksData = await filmsApi.tracks.generate(filmId, { overwrite: true });
                } catch {
                    tracksData = [];
                }
            }
            const timelineTracks = tracksData
                .map((track) => transformBackendTrack(track))
                .sort((a, b) => ((a.order_index || 0) - (b.order_index || 0)));
            setTracks(timelineTracks);
            return timelineTracks;
        } catch (err) {
            console.error("Failed to load tracks:", err);
            throw err;
        }
    }, [filmId]);

    const fetchLayers = useCallback(async () => {
        try {
            const layersData = await filmsApi.timelineLayers.getAll();
            setLayers(layersData || []);
            return layersData;
        } catch (err) {
            console.error("Failed to load timeline layers:", err);
            throw err;
        }
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const filmData = await fetchFilm();
            if (filmData) {
                await Promise.all([fetchScenes(filmData), fetchTracks(), fetchLayers()]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load film data");
        } finally {
            setLoading(false);
        }
    }, [fetchFilm, fetchScenes, fetchTracks, fetchLayers]);

    const refreshScenes = useCallback(async () => {
        try {
            const freshFilm = await fetchFilm();
            await fetchScenes(freshFilm || undefined);
        } catch {
            await fetchScenes();
        }
    }, [fetchFilm, fetchScenes]);

    const refreshTracks = useCallback(async () => { await fetchTracks(); }, [fetchTracks]);

    // Reconcile scenes with track IDs after tracks load
    useEffect(() => {
        reconcileScenesTracks(tracks);
    }, [tracks]);

    return {
        film, scenes, tracks, layers, loading, error,
        setFilm, setScenes, setTracks,
        loadAll, refreshScenes, refreshTracks,
    };
};
