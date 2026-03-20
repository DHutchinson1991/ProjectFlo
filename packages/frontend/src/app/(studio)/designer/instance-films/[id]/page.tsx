"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, CircularProgress, Alert, Button, Link, Stack } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import ContentBuilder from "../../components/ContentBuilder";
import { FilmApiProvider, createProjectFilmApi, createInquiryFilmApi, type FilmContentApi } from "@/components/films/FilmApiContext";
import { FilmRightPanel } from "@/components/films";
import { useFilmEquipment } from "@/hooks/films";
import { useTimelineStorage, useTimelineSave } from "@/hooks/content-builder/data";
import { useFilmSubjects } from "@/hooks/subjects/useFilmSubjects";
import { SubjectCategory } from "@/lib/types/domains/subjects";
import { FilmType } from "@/lib/types/domains/film";
import type { Film } from "@/lib/types/domains/film";
import { useBrand } from "@/app/providers/BrandProvider";
import type { FilmEquipmentAssignmentsBySlot } from "@/types/film-equipment.types";
import { api, apiClient } from "@/lib/api";
import { createScenesApi } from "@/lib/api/scenes.api";
import { buildAssignmentsBySlot, buildEquipmentSlotKey, buildEquipmentSlotNote } from "@/lib/utils/equipmentAssignments";
import { transformBackendTrack } from "@/lib/utils/trackUtils";
import { transformFilmMomentsTimeline } from "@/lib/utils/momentTransform";
import { getSceneColorByType } from "../../components/ContentBuilder/utils/colorUtils";
import { enrichScenesWithBeats } from "@/hooks/films/enrichScenesWithBeats";
import type { TimelineScene, TimelineTrack } from "@/lib/types/timeline";

/**
 * Instance Film Editor Page
 *
 * Mounts the existing ContentBuilder for project/inquiry film instances,
 * exactly matching the library film editor's feature set (right panel with
 * Activities / Equipment / Subjects / Operators tabs, equipment assignments,
 * subject counts, film name editing, etc.).
 *
 * Data flow:
 *   • Library Film object loaded via `filmId` query param for metadata / right-panel tabs.
 *   • Instance scenes & tracks loaded from /instance-films endpoints.
 *   • FilmApiProvider wraps ContentBuilder so all save/delete operations
 *     route through the adapter instead of the library /scenes endpoints.
 *
 * Route: /designer/instance-films/[id]
 * Query params:
 *   ?mode=project|inquiry   (default: project)
 *   ?filmId=<n>             (library film ID — powers right-panel tabs)
 *   ?projectId=<n>          (optional: for back-navigation)
 *   ?inquiryId=<n>          (optional: for back-navigation)
 *   ?packageId=<n>          (optional: links to the package context)
 *   ?activityId=<n>         (optional: activity filter)
 */
export default function InstanceFilmEditorPage({ params }: { params: { id: string } }) {
    const projectFilmId = parseInt(params.id, 10);
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasInitialized = useRef(false);
    const { currentBrand } = useBrand();
    const lastBrandId = useRef<number | null>(null);

    const mode = (searchParams.get("mode") as "project" | "inquiry") || "project";
    const libraryFilmId = searchParams.get("filmId") ? parseInt(searchParams.get("filmId")!, 10) : null;
    const projectId = searchParams.get("projectId");
    const inquiryId = searchParams.get("inquiryId");
    const linkedPackageId = searchParams.get("packageId");
    const linkedActivityId = searchParams.get("activityId");
    const linkedPackageHref = linkedPackageId ? `/designer/packages/${linkedPackageId}` : null;

    // Use the library filmId for hooks that call library endpoints (right-panel tabs, equipment, subjects).
    // Fall back to projectFilmId so the page still works without the query param.
    const filmIdForLibrary = libraryFilmId ?? projectFilmId;

    // ── Core data state ─────────────────────────────────────────────
    const [film, setFilm] = useState<Film | null>(null);
    const [filmScenes, setFilmScenes] = useState<TimelineScene[]>([]);
    const [tracks, setTracks] = useState<any[]>([]);
    const [layers, setLayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Equipment state for ContentBuilder
    const [equipmentSummary, setEquipmentSummary] = useState<{
        cameras: number; audio: number; music: number;
    } | null>(null);
    const [equipmentAssignmentsBySlot, setEquipmentAssignmentsBySlot] = useState<FilmEquipmentAssignmentsBySlot>({});

    // ── Build the FilmContentApi adapter ─────────────────────────────
    const filmApi: FilmContentApi = React.useMemo(() => {
        return mode === "inquiry"
            ? createInquiryFilmApi(projectFilmId)
            : createProjectFilmApi(projectFilmId);
    }, [mode, projectFilmId]);

    // ── Timeline storage (localStorage/sessionStorage keyed to instance) ──
    const { saveTimeline, saveTracks: saveTracksToStorage } = useTimelineStorage(projectFilmId);

    // ── Subjects (loads from library film — shared subject library) ───
    const {
        subjects,
        templates: subjectTemplates,
        createSubject,
        deleteSubject,
        loadTemplates,
    } = useFilmSubjects(filmIdForLibrary, currentBrand?.id);

    // ── Equipment management (operates on library film via right panel) ─
    const { handleEquipmentChange } = useFilmEquipment(
        filmIdForLibrary,
        setTracks,
        saveTracksToStorage,
    );

    // ── Timeline save hook (routes through filmApi adapter) ──────────
    const { handleSave } = useTimelineSave(
        projectFilmId,
        saveTimeline,
        saveTracksToStorage,
        filmApi,
    );

    // ── Film name save ──────────────────────────────────────────────
    const handleSaveFilm = useCallback(async (newName: string) => {
        if (!film) return;
        try {
            const updated = await api.films.update(film.id, { name: newName });
            setFilm({ ...film, name: updated.name });
        } catch (err) {
            console.error("Failed to update film name:", err);
            throw err;
        }
    }, [film, setFilm]);

    // ── Subject handlers ────────────────────────────────────────────
    const handleAddSubject = useCallback(async (name: string, category: SubjectCategory) => {
        try {
            await createSubject({
                film_id: filmIdForLibrary,
                name,
                category,
                is_custom: true,
            });
        } catch (err) {
            console.error("Failed to create subject:", err);
            throw err;
        }
    }, [filmIdForLibrary, createSubject]);

    const handleDeleteSubject = useCallback(async (subjectId: number) => {
        try {
            await deleteSubject(subjectId);
        } catch (err) {
            console.error("Failed to delete subject:", err);
            throw err;
        }
    }, [deleteSubject]);

    // ── Load all data on mount ──────────────────────────────────────
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
                // 1. Load library Film object for metadata/display
                let filmData: Film | null = null;
                if (libraryFilmId) {
                    try {
                        filmData = await api.films.getById(libraryFilmId);
                    } catch {
                        console.warn("Could not load library film — using synthetic object");
                    }
                }

                // 2. Load instance scenes & tracks in parallel with layers & templates
                let [instanceScenes, instanceTracks, layersData] = await Promise.all([
                    api.instanceFilms.scenes.getAll(projectFilmId),
                    api.instanceFilms.tracks.getAll(projectFilmId),
                    api.timeline.getLayers().catch(() => []),
                ]);

                // 2b. Auto-clone: if instance tables are empty but a library film
                //     is linked, trigger a deep-clone and reload the data.
                if (
                    (!instanceScenes || instanceScenes.length === 0) &&
                    libraryFilmId
                ) {
                    try {
                        const cloneResult = await api.instanceFilms.cloneFromLibrary(projectFilmId);
                        if (cloneResult?.cloned) {
                            // Reload instance data after clone
                            [instanceScenes, instanceTracks] = await Promise.all([
                                api.instanceFilms.scenes.getAll(projectFilmId),
                                api.instanceFilms.tracks.getAll(projectFilmId),
                            ]);
                        }
                    } catch (cloneErr) {
                        console.warn("Auto-clone from library failed:", cloneErr);
                    }
                }

                // 3. Transform instance scenes → TimelineScene shape
                const rawScenes = (instanceScenes || []).map((s: any, idx: number) => ({
                    id: s.id as number,
                    name: (s.name as string) || `Scene ${idx + 1}`,
                    duration: (s.duration_seconds as number) ?? 60,
                    scene_type: "video" as const,
                    scene_mode: s.mode ?? null,
                    start_time: 0,
                    track_id: 0,
                    color: getSceneColorByType?.("video") ?? "#4a90d9",
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
                        name: (m.name as string) || "Moment",
                        duration: (m.duration as number) ?? 60,
                        order_index: (m.order_index as number) ?? 0,
                        recording_setup: m.recording_setup ?? null,
                        moment_music: m.moment_music ?? null,
                    })),
                    beats: ((s.beats as any[]) || []).map((b: any) => ({
                        id: b.id as number,
                        film_scene_id: s.id as number,
                        name: (b.name as string) || "Beat",
                        duration_seconds: (b.duration_seconds as number) ?? 10,
                        order_index: (b.order_index as number) ?? 0,
                        shot_count: b.shot_count ?? null,
                        created_at: b.created_at ?? new Date().toISOString(),
                        updated_at: b.updated_at ?? new Date().toISOString(),
                    })),
                }));

                // Enrich scenes with beats (same as library page)
                let enrichedScenes: TimelineScene[];
                try {
                    enrichedScenes = await enrichScenesWithBeats(rawScenes);
                } catch {
                    enrichedScenes = rawScenes;
                }
                enrichedScenes.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

                // 4. Transform tracks
                const transformedTracks = (instanceTracks || [])
                    .map((t: any) => transformBackendTrack(t))
                    .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

                // 5. Build a synthetic Film object if library load failed
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

                // 6. Load subject templates
                await loadTemplates();
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to load film data";
                console.error("Failed to load instance film data:", err);
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectFilmId, currentBrand]);

    // ── Load equipment assignments ──────────────────────────────────
    useEffect(() => {
        if (!libraryFilmId) return;
        let isMounted = true;
        const loadAssignments = async () => {
            try {
                const assignments = await api.films.equipmentAssignments.getAll(libraryFilmId);
                if (isMounted) {
                    setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(assignments));
                }
            } catch (err) {
                console.error("Failed to load equipment assignments:", err);
            }
        };
        loadAssignments();
        return () => { isMounted = false; };
    }, [libraryFilmId]);

    // ── Navigation ──────────────────────────────────────────────────
    const handleBack = useCallback(() => {
        if (projectId) {
            router.push(`/projects/${projectId}`);
        } else if (inquiryId) {
            router.push(`/inquiries/${inquiryId}`);
        } else {
            router.back();
        }
    }, [router, projectId, inquiryId]);

    // ── Render: Loading ─────────────────────────────────────────────
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    // ── Render: Error ───────────────────────────────────────────────
    if (error || !film) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || "Film not found"}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                >
                    Back
                </Button>
            </Box>
        );
    }

    // ── Right panel (identical to library film page) ────────────────
    const rightPanel = (
        <FilmRightPanel
            film={film}
            filmId={filmIdForLibrary}
            packageId={linkedPackageId ? Number(linkedPackageId) : null}
            subjects={subjects}
            subjectTemplates={subjectTemplates}
            layers={layers}
            scenes={filmScenes}
            onEquipmentChange={handleEquipmentChange}
            onEquipmentAssignmentsChange={setEquipmentAssignmentsBySlot}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
            onSaveFilm={handleSaveFilm}
        />
    );

    // ── Main render ─────────────────────────────────────────────────
    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <Box sx={{ flex: 1, overflow: "visible", p: 0 }}>
                    {linkedPackageId && (
                        <Stack spacing={1} sx={{ px: 2, pt: 2 }}>
                            <Alert severity="info">
                                This film is an instance copy linked to a package.{' '}
                                {linkedPackageHref && (
                                    <Link href={linkedPackageHref} underline="hover">
                                        View package
                                    </Link>
                                )}
                            </Alert>
                        </Stack>
                    )}
                    <FilmApiProvider filmApi={filmApi}>
                        <ContentBuilder
                            filmId={projectFilmId}
                            film={film}
                            initialScenes={filmScenes}
                            initialTracks={tracks}
                            onSave={handleSave}
                            onSaveFilmName={handleSaveFilm}
                            readOnly={false}
                            rightPanel={rightPanel}
                            subjectCount={subjects.length}
                            packageId={linkedPackageId ? Number(linkedPackageId) : undefined}
                            linkedActivityId={linkedActivityId ? Number(linkedActivityId) : undefined}
                            instanceOwnerType={mode}
                            instanceOwnerId={mode === "inquiry" ? (inquiryId ? Number(inquiryId) : null) : (projectId ? Number(projectId) : null)}
                            equipmentConfig={equipmentSummary || undefined}
                            equipmentAssignmentsBySlot={equipmentAssignmentsBySlot}
                            filmApi={filmApi}
                        />
                    </FilmApiProvider>
                </Box>
            </Box>
        </Box>
    );
}
