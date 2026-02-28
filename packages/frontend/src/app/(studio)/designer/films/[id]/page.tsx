"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, CircularProgress, Alert, Button, Link, Stack } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import ContentBuilder from "../../components/ContentBuilder";
import { FilmDetailHeader, FilmRightPanel } from "@/components/films";
import { useFilmData, useFilmEquipment } from "@/hooks/films";
import { useTimelineStorage, useTimelineSave } from "@/hooks/content-builder/data";
import { useFilmSubjects } from "@/hooks/subjects/useFilmSubjects";
import { SubjectCategory } from "@/lib/types/domains/subjects";
import type { Film } from "@/lib/types/domains/film";
import { useBrand } from "@/app/providers/BrandProvider";
import type { FilmEquipmentAssignmentsBySlot } from "@/types/film-equipment.types";
import { api } from "@/lib/api";
import { buildAssignmentsBySlot, buildEquipmentSlotKey, buildEquipmentSlotNote } from "@/lib/utils/equipmentAssignments";
import { transformBackendTrack } from "@/lib/utils/trackUtils";

export default function FilmDetailPage({ params }: { params: { id: string } }) {
    const filmId = parseInt(params.id, 10);
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasInitialized = useRef(false);
    const { currentBrand } = useBrand();
    const lastBrandId = useRef<number | null>(null);

    // Equipment state for ContentBuilder
    const [equipmentSummary, setEquipmentSummary] = useState<{
        cameras: number;
        audio: number;
        music: number;
    } | null>(null);
    const [equipmentAssignmentsBySlot, setEquipmentAssignmentsBySlot] = useState<FilmEquipmentAssignmentsBySlot>({});

    // Use custom hooks for data management
    const {
        film,
        scenes: filmScenes,
        tracks,
        layers: timelineLayers,
        loading,
        error,
        setFilm,
        setTracks,
        loadAll,
        refreshScenes,
    } = useFilmData(filmId);

    const { saveTimeline, saveTracks } = useTimelineStorage(filmId);

    const {
        subjects,
        templates: subjectTemplates,
        typeTemplates,
        createSubject,
        deleteSubject,
        loadTemplates,
        loadTypeTemplates,
    } = useFilmSubjects(filmId, currentBrand?.id);

    // Equipment management hook
    const { handleEquipmentChange } = useFilmEquipment(
        filmId,
        setTracks,
        saveTracks
    );

    // Timeline save hook
    const { handleSave } = useTimelineSave(
        filmId,
        saveTimeline,
        saveTracks
    );

    // Handle scene creation
    const handleSceneCreated = useCallback(() => {
        console.log("🎬 Scene created, refreshing scenes list...");
        refreshScenes();
    }, [refreshScenes]);

    // Handle film name save
    const handleSaveFilm = useCallback(async (newName: string) => {
        if (!film) return;
        try {
            const updated = await import("@/lib/api").then(({ api }) =>
                api.films.update(film.id, { name: newName })
            );
            // Merge the updated data with existing film data to maintain all fields
            setFilm({ ...film, name: updated.name });
        } catch (err) {
            console.error("Failed to update film:", err);
            throw err;
        }
    }, [film, setFilm]);

    // Handle subject creation
    const handleAddSubject = useCallback(async (name: string, category: SubjectCategory) => {
        try {
            await createSubject({
                film_id: filmId,
                name,
                category,
                is_custom: true,
            });
        } catch (err) {
            console.error("Failed to create subject:", err);
            throw err;
        }
    }, [filmId, createSubject]);

    const handleDeleteSubject = useCallback(async (subjectId: number) => {
        try {
            await deleteSubject(subjectId);
        } catch (err) {
            console.error("Failed to delete subject:", err);
            throw err;
        }
    }, [deleteSubject]);

    const linkedPackageId = searchParams.get("packageId");
    const linkedItemId = searchParams.get("itemId");
    const linkedPackageHref = linkedPackageId ? `/designer/packages/${linkedPackageId}` : null;

    // Load all data on mount - only run once when brand is ready
    useEffect(() => {
        // Wait for brand to be available before loading
        if (!currentBrand) {
            return;
        }

        // Reset initialization flag if brand changed
        if (lastBrandId.current !== currentBrand.id) {
            hasInitialized.current = false;
            lastBrandId.current = currentBrand.id;
        }

        // Only initialize once per filmId/brand combination
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const init = async () => {
            await loadAll();
            await loadTemplates();
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filmId, currentBrand]);

    useEffect(() => {
        let isMounted = true;
        const loadAssignments = async () => {
            try {
                const assignments = await api.films.equipmentAssignments.getAll(filmId);
                if (isMounted) {
                    setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(assignments));
                }
            } catch (err) {
                console.error("Failed to load equipment assignments:", err);
            }
        };

        loadAssignments();
        return () => {
            isMounted = false;
        };
    }, [filmId]);

    // ─── Auto-sync tracks from package operator equipment ─────────────
    const hasSyncedPackageTracks = useRef(false);
    useEffect(() => {
        if (!linkedPackageId || hasSyncedPackageTracks.current) return;
        if (!film) return; // Wait for film data to be available (provides brand_id for package fetch)
        hasSyncedPackageTracks.current = true;

        const syncTracksFromPackage = async () => {
            try {
                const pkgId = Number(linkedPackageId);
                const [operators, currentTracks] = await Promise.all([
                    api.operators.packageDay.getAll(pkgId),
                    api.films.tracks.getAll(filmId),
                ]);

                // Read unmanned camera count from package contents
                let unmannedCameraCount = 0;
                try {
                    const pkgData = await api.servicePackages.getOne(film.brand_id, pkgId);
                    unmannedCameraCount = (pkgData?.contents as any)?.unmanned_cameras || 0;
                } catch (pkgErr) {
                    console.warn('Could not fetch package contents for unmanned count:', pkgErr);
                }

                // Build ordered list of operators-with-camera and collect audio equipment
                // Each operator with a camera gets one camera track; each unique audio device gets one audio track
                const cameraOperators: { templateId: number; cameraEquipmentId: number | null }[] = [];
                const audioEquipment: { equipmentId: number }[] = [];
                const seenCameraOps = new Set<number>();
                const seenAudioIds = new Set<number>();

                (operators || []).forEach((op: any) => {
                    const templateId = op.operator_template_id ?? op.operator_template?.id ?? op.id;
                    const equipment = op.equipment?.length > 0
                        ? op.equipment
                        : op.operator_template?.default_equipment || [];
                    let cameraEqId: number | null = null;
                    equipment.forEach((eq: any) => {
                        const cat = (eq.equipment?.category || '').toUpperCase();
                        const eqId = eq.equipment_id ?? eq.equipment?.id;
                        if (cat === 'CAMERA' && !cameraEqId) cameraEqId = eqId ?? null;
                        if (cat === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) {
                            seenAudioIds.add(eqId);
                            audioEquipment.push({ equipmentId: eqId });
                        }
                    });
                    if (cameraEqId !== null && !seenCameraOps.has(templateId)) {
                        seenCameraOps.add(templateId);
                        cameraOperators.push({ templateId, cameraEquipmentId: cameraEqId });
                    }
                });

                const neededCameras = cameraOperators.length + unmannedCameraCount;
                const neededAudio = audioEquipment.length;
                const currentCameras = currentTracks.filter((t: any) => t.type === 'VIDEO').length;
                const currentAudio = currentTracks.filter((t: any) => t.type === 'AUDIO').length;

                // Build update payload — only include audio if the package has audio equipment
                const update: { num_cameras?: number; num_audio?: number; allow_removal: boolean } = { allow_removal: true };
                let needsUpdate = false;
                if (neededCameras !== currentCameras) {
                    update.num_cameras = neededCameras;
                    needsUpdate = true;
                }
                if (audioEquipment.length > 0 && neededAudio !== currentAudio) {
                    update.num_audio = neededAudio;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    console.log(`📦 [PACKAGE SYNC] Adjusting tracks: cameras ${currentCameras}→${update.num_cameras ?? currentCameras}, audio ${currentAudio}→${update.num_audio ?? currentAudio}`);
                    await api.films.equipment.update(filmId, update);
                }

                // Reload tracks to get their IDs (whether we changed count or not)
                const rawTracks = await api.films.tracks.getAll(filmId);

                // Assign operator_template_id to camera tracks and create equipment assignments
                const videoTracks = rawTracks.filter((t: any) => t.type === 'VIDEO').sort((a: any, b: any) => a.order_index - b.order_index);
                const audioTracks = rawTracks.filter((t: any) => t.type === 'AUDIO').sort((a: any, b: any) => a.order_index - b.order_index);

                // Assign operators to camera tracks
                const assignmentPromises: Promise<any>[] = [];
                for (let i = 0; i < videoTracks.length && i < cameraOperators.length; i++) {
                    const track = videoTracks[i];
                    const opData = cameraOperators[i];
                    if (track.operator_template_id !== opData.templateId) {
                        assignmentPromises.push(
                            api.films.tracks.update(filmId, track.id, { operator_template_id: opData.templateId })
                        );
                    }
                    // Create equipment assignment for this camera slot
                    if (opData.cameraEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('camera', i + 1));
                        assignmentPromises.push(
                            api.films.equipmentAssignments.assign(filmId, {
                                equipment_id: opData.cameraEquipmentId,
                                notes: slotNote,
                            }).catch(() => {/* ignore if already assigned */})
                        );
                    }
                }

                // Create equipment assignments for audio slots
                for (let i = 0; i < audioTracks.length && i < audioEquipment.length; i++) {
                    const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('audio', i + 1));
                    assignmentPromises.push(
                        api.films.equipmentAssignments.assign(filmId, {
                            equipment_id: audioEquipment[i].equipmentId,
                            notes: slotNote,
                        }).catch(() => {/* ignore if already assigned */})
                    );
                }

                if (assignmentPromises.length > 0) {
                    await Promise.all(assignmentPromises);
                    console.log(`📦 [PACKAGE SYNC] Assigned ${cameraOperators.length} operator(s) to camera tracks, ${audioEquipment.length} audio device(s) to audio tracks`);
                }

                // Final reload of tracks + equipment assignments
                const [finalTracks, finalAssignments] = await Promise.all([
                    api.films.tracks.getAll(filmId),
                    api.films.equipmentAssignments.getAll(filmId),
                ]);
                setTracks(finalTracks.map((t: any) => transformBackendTrack(t)));
                setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(finalAssignments));
            } catch (err) {
                console.error('Failed to sync tracks from package:', err);
            }
        };

        syncTracksFromPackage();
    }, [linkedPackageId, filmId, setTracks, film]);

    // Show loading/error states
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !film) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || "Film not found"}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push("/designer/films")}
                    sx={{ mt: 2 }}
                >
                    Back to Films
                </Button>
            </Box>
        );
    }

    // Right panel with all tabs
    const rightPanel = (
        <FilmRightPanel
            film={film!}
            filmId={filmId}
            packageId={linkedPackageId ? Number(linkedPackageId) : null}
            subjects={subjects}
            subjectTemplates={subjectTemplates}
            layers={timelineLayers}
            scenes={filmScenes}
            onEquipmentChange={handleEquipmentChange}
            onEquipmentAssignmentsChange={setEquipmentAssignmentsBySlot}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
            onSaveFilm={handleSaveFilm}
        />
    );

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Main Content with Right Panel */}
            <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <Box sx={{ flex: 1, overflow: "visible", p: 0 }}>
                    {linkedPackageId && linkedItemId && (
                        <Stack spacing={1} sx={{ px: 2, pt: 2 }}>
                            <Alert severity="info">
                                This film is linked to a package item.{' '}
                                {linkedPackageHref && (
                                    <Link href={linkedPackageHref} underline="hover">
                                        View package
                                    </Link>
                                )}
                            </Alert>
                        </Stack>
                    )}
                    <ContentBuilder
                        filmId={filmId}
                        film={film}
                        initialScenes={filmScenes}
                        initialTracks={tracks}
                        onSave={handleSave}
                        onSaveFilmName={handleSaveFilm}
                        readOnly={false}
                        rightPanel={rightPanel}
                        subjectCount={subjects.length}
                        packageId={linkedPackageId ? Number(linkedPackageId) : undefined}
                        equipmentConfig={equipmentSummary || undefined}
                        equipmentAssignmentsBySlot={equipmentAssignmentsBySlot}
                    />
                </Box>
            </Box>
        </Box>
    );
}
