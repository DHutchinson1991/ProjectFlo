import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getSceneColorByType } from '@/features/content/content-builder';
import { enrichScenesWithBeats } from '@/features/content/scenes/utils/enrichScenesWithBeats';
import { transformBackendTrack } from '@/lib/utils/trackUtils';
import { FilmType } from '../types';
import type { Film } from '../types';
import type { TimelineScene } from '@/lib/types/timeline';

interface UseInstanceFilmInitOptions {
    projectFilmId: number;
    libraryFilmId: number | null;
    currentBrand: { id: number } | null;
    setFilm: (film: Film | null) => void;
    setFilmScenes: (scenes: TimelineScene[]) => void;
    setTracks: (tracks: any[]) => void;
    setLayers: (layers: any[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    loadTemplates: () => Promise<void>;
}

export function useInstanceFilmInit({
    projectFilmId,
    libraryFilmId,
    currentBrand,
    setFilm,
    setFilmScenes,
    setTracks,
    setLayers,
    setLoading,
    setError,
    loadTemplates,
}: UseInstanceFilmInitOptions) {
    const hasInitialized = useRef(false);
    const lastBrandId = useRef<number | null>(null);

    useEffect(() => {
        if (!currentBrand) return;

        if (lastBrandId.current !== currentBrand.id) {
            hasInitialized.current = false;
            lastBrandId.current = currentBrand.id;
        }

        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const init = async () => {
            setLoading(true);
            setError(null);
            try {
                let filmData: Film | null = null;
                if (libraryFilmId) {
                    try {
                        filmData = await api.films.getById(libraryFilmId);
                    } catch {
                        console.warn('Could not load library film — using synthetic object');
                    }
                }

                let [instanceScenes, instanceTracks, layersData] = await Promise.all([
                    api.instanceFilms.scenes.getAll(projectFilmId),
                    api.instanceFilms.tracks.getAll(projectFilmId),
                    api.timeline.getLayers().catch(() => []),
                ]);

                if ((!instanceScenes || instanceScenes.length === 0) && libraryFilmId) {
                    try {
                        const cloneResult = await api.instanceFilms.cloneFromLibrary(projectFilmId);
                        if (cloneResult?.cloned) {
                            [instanceScenes, instanceTracks] = await Promise.all([
                                api.instanceFilms.scenes.getAll(projectFilmId),
                                api.instanceFilms.tracks.getAll(projectFilmId),
                            ]);
                        }
                    } catch (cloneErr) {
                        console.warn('Auto-clone from library failed:', cloneErr);
                    }
                }

                const rawScenes = (instanceScenes || []).map((s: any, idx: number) => ({
                    id: s.id as number,
                    name: (s.name as string) || `Scene ${idx + 1}`,
                    duration: (s.duration_seconds as number) ?? 60,
                    scene_type: 'video' as const,
                    scene_mode: s.mode ?? null,
                    start_time: 0,
                    track_id: 0,
                    color: getSceneColorByType?.('video') ?? '#4a90d9',
                    order_index: (s.order_index as number) ?? idx,
                    scene_template_id: s.scene_template_id ?? null,
                    scene_template_type: s.template?.type ?? s.mode ?? null,
                    template: s.template ?? null,
                    shot_count: s.shot_count ?? null,
                    duration_seconds: s.duration_seconds ?? null,
                    recording_setup: s.recording_setup ?? null,
                    scene_music: s.scene_music ?? null,
                    subjects: s.subjects ?? [],
                    moments: ((s.moments as any[]) || []).map((m: any) => ({
                        id: m.id as number,
                        name: (m.name as string) || 'Moment',
                        duration: (m.duration as number) ?? 60,
                        order_index: (m.order_index as number) ?? 0,
                        recording_setup: m.recording_setup ?? null,
                        moment_music: m.moment_music ?? null,
                    })),
                    beats: ((s.beats as any[]) || []).map((b: any) => ({
                        id: b.id as number,
                        film_scene_id: s.id as number,
                        name: (b.name as string) || 'Beat',
                        duration_seconds: (b.duration_seconds as number) ?? 10,
                        order_index: (b.order_index as number) ?? 0,
                        shot_count: b.shot_count ?? null,
                        created_at: b.created_at ?? new Date().toISOString(),
                        updated_at: b.updated_at ?? new Date().toISOString(),
                    })),
                }));

                let enrichedScenes: TimelineScene[];
                try {
                    enrichedScenes = await enrichScenesWithBeats(rawScenes);
                } catch {
                    enrichedScenes = rawScenes;
                }
                enrichedScenes.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

                const transformedTracks = (instanceTracks || [])
                    .map((t: any) => transformBackendTrack(t))
                    .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

                if (!filmData) {
                    filmData = {
                        id: projectFilmId,
                        name: `Instance Film #${projectFilmId}`,
                        brand_id: currentBrand.id,
                        film_type: FilmType.FEATURE,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        scenes: enrichedScenes as any,
                        tracks: transformedTracks as any,
                    };
                }

                setFilm(filmData);
                setFilmScenes(enrichedScenes);
                setTracks(transformedTracks);
                setLayers(layersData || []);

                await loadTemplates();
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to load film data';
                console.error('Failed to load instance film data:', err);
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectFilmId, currentBrand]);
}
