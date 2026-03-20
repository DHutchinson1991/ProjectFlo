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
import { api, apiClient } from "@/lib/api";
import { createScenesApi } from "@/lib/api/scenes.api";
import type { ApiClient } from "@/lib/api/api-client.types";
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
    const linkedActivityId = searchParams.get("activityId");
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
                const [operators, currentTracks, pkgData] = await Promise.all([
                    api.operators.packageDay.getAll(pkgId),
                    api.films.tracks.getAll(filmId),
                    api.servicePackages.getOne(film.brand_id, pkgId).catch(() => null),
                ]);

                // Build ordered list of operators-with-camera and audio equipment.
                // Each unique camera (by equipment ID) gets its own VIDEO track.
                // Each unique audio device (by equipment ID) gets its own AUDIO track.
                const cameraOperators: { crewId: number | null; cameraEquipmentId: number | null; isUnmanned: boolean }[] = [];
                const audioEquipment: { crewId: number | null; audioEquipmentId: number }[] = [];
                const seenCameraIds = new Set<number>();
                const seenAudioIds = new Set<number>();
                const pendingUnmannedCams: { crewId: number | null; cameraEquipmentId: number; isUnmanned: boolean }[] = [];

                (operators || []).forEach((op: any) => {
                    const crewId = op.contributor_id ?? op.id;
                    const equipment = op.equipment?.length > 0 ? op.equipment : [];

                    equipment.forEach((eq: any) => {
                        const cat = (eq.equipment?.category || '').toUpperCase();
                        const eqId = eq.equipment_id ?? eq.equipment?.id;
                        if (cat === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) {
                            seenCameraIds.add(eqId);
                            const isEquipUnmanned = eq.equipment?.is_unmanned === true;
                            if (isEquipUnmanned) {
                                // Unmanned equipment — still reference the owning operator
                                pendingUnmannedCams.push({ crewId, cameraEquipmentId: eqId, isUnmanned: true });
                            } else {
                                cameraOperators.push({ crewId, cameraEquipmentId: eqId, isUnmanned: false });
                            }
                        } else if (cat === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) {
                            seenAudioIds.add(eqId);
                            audioEquipment.push({ crewId, audioEquipmentId: eqId });
                        }
                    });
                });

                // Also pick up cameras from day_equipment that aren't assigned to
                // any operator — these are unmanned / standalone cameras.
                const dayEquipMap = (pkgData?.contents as any)?.day_equipment || {};
                console.log('[syncTracksFromPackage] day_equipment map:', dayEquipMap);
                console.log('[syncTracksFromPackage] seenCameraIds before day_equipment scan:', Array.from(seenCameraIds));
                
                Object.values(dayEquipMap).forEach((items: any) => {
                    (items || []).forEach((item: any) => {
                        const eqId = item.equipment_id;
                        console.log(`[syncTracksFromPackage] Found day_equipment: eqId=${eqId}, slot_type=${item.slot_type}, isAlreadySeen=${item.slot_type === 'CAMERA' ? seenCameraIds.has(eqId) : seenAudioIds.has(eqId)}`);
                        if (item.slot_type === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) {
                            console.log(`[syncTracksFromPackage] Adding unmanned camera: eqId=${eqId}`);
                            seenCameraIds.add(eqId);
                            pendingUnmannedCams.push({ crewId: null, cameraEquipmentId: eqId, isUnmanned: true });
                        } else if (item.slot_type === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) {
                            console.log(`[syncTracksFromPackage] Adding audio from day_equipment: eqId=${eqId}`);
                            seenAudioIds.add(eqId);
                            audioEquipment.push({ crewId: null, audioEquipmentId: eqId });
                        }
                    });
                });

                console.log('[syncTracksFromPackage] Operator cameras:', cameraOperators.length);
                console.log('[syncTracksFromPackage] Pending unmanned cameras:', pendingUnmannedCams.length);
                console.log('[syncTracksFromPackage] Audio equipment:', audioEquipment.length);

                // Append unmanned cameras after all manned cameras
                cameraOperators.push(...pendingUnmannedCams);

                const neededCameras = cameraOperators.length;
                const neededAudio = audioEquipment.length;
                const currentCameras = currentTracks.filter((t: any) => t.type === 'VIDEO').length;
                const currentAudio = currentTracks.filter((t: any) => t.type === 'AUDIO').length;
                console.log('[syncTracksFromPackage] Camera count - needed:', neededCameras, 'current:', currentCameras);
                console.log('[syncTracksFromPackage] Audio count - needed:', neededAudio, 'current:', currentAudio);

                // Reconcile camera and audio track counts
                if (neededCameras !== currentCameras || neededAudio !== currentAudio) {
                    await api.films.equipment.update(filmId, {
                        num_cameras: neededCameras,
                        num_audio: neededAudio,
                        allow_removal: true,
                    });
                }

                // Reload tracks to get their IDs
                const rawTracks = await api.films.tracks.getAll(filmId);

                // Assign contributor_id to camera tracks and create equipment assignments
                const videoTracks = rawTracks.filter((t: any) => t.type === 'VIDEO').sort((a: any, b: any) => {
                    const numA = parseInt(a.name?.match(/(\d+)/)?.[1] || '0', 10);
                    const numB = parseInt(b.name?.match(/(\d+)/)?.[1] || '0', 10);
                    return numA - numB;
                });

                // Assign operators to camera tracks
                const assignmentPromises: Promise<any>[] = [];
                console.log('[syncTracksFromPackage] About to assign', videoTracks.length, 'video tracks to', cameraOperators.length, 'camera operators');
                
                for (let i = 0; i < videoTracks.length && i < cameraOperators.length; i++) {
                    const track = videoTracks[i];
                    const opData = cameraOperators[i];
                    const needsCrewUpdate = track.contributor_id !== opData.crewId;
                    const needsUnmannedUpdate = track.is_unmanned !== opData.isUnmanned;
                    console.log(`[syncTracksFromPackage] Track ${i}: crewId=${opData.crewId}, isUnmanned=${opData.isUnmanned}, eqId=${opData.cameraEquipmentId}, needsCrewUpdate=${needsCrewUpdate}, needsUnmannedUpdate=${needsUnmannedUpdate}`);
                    
                    if (needsCrewUpdate || needsUnmannedUpdate) {
                        assignmentPromises.push(
                            api.films.tracks.update(filmId, track.id, {
                                contributor_id: opData.crewId,
                                is_unmanned: opData.isUnmanned,
                            })
                        );
                    }
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

                // Assign audio equipment to audio tracks
                const audioTracks = rawTracks.filter((t: any) => t.type === 'AUDIO').sort((a: any, b: any) => {
                    const numA = parseInt(a.name?.match(/(\d+)/)?.[1] || '0', 10);
                    const numB = parseInt(b.name?.match(/(\d+)/)?.[1] || '0', 10);
                    return numA - numB;
                });
                console.log('[syncTracksFromPackage] About to assign', audioTracks.length, 'audio tracks to', audioEquipment.length, 'audio equipment');

                for (let i = 0; i < audioTracks.length && i < audioEquipment.length; i++) {
                    const track = audioTracks[i];
                    const audioData = audioEquipment[i];
                    const needsCrewUpdate = track.contributor_id !== audioData.crewId;
                    console.log(`[syncTracksFromPackage] Audio Track ${i}: crewId=${audioData.crewId}, eqId=${audioData.audioEquipmentId}, needsCrewUpdate=${needsCrewUpdate}`);

                    if (needsCrewUpdate) {
                        assignmentPromises.push(
                            api.films.tracks.update(filmId, track.id, {
                                contributor_id: audioData.crewId,
                            })
                        );
                    }
                    if (audioData.audioEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('audio', i + 1));
                        assignmentPromises.push(
                            api.films.equipmentAssignments.assign(filmId, {
                                equipment_id: audioData.audioEquipmentId,
                                notes: slotNote,
                            }).catch(() => {/* ignore if already assigned */})
                        );
                    }
                }

                console.log('[syncTracksFromPackage] Making', assignmentPromises.length, 'assignment promises');

                // Wait for all track updates and equipment assignments to complete
                await Promise.all(assignmentPromises);

                // ── Sync recording setups so all scenes show on all synced tracks ──
                try {
                    const scenesApiInstance = createScenesApi(apiClient as unknown as ApiClient);
                    const videoTrackIds = rawTracks.filter((t: any) => t.type === 'VIDEO').map((t: any) => t.id);
                    const audioTrackIds = rawTracks.filter((t: any) => t.type === 'AUDIO').map((t: any) => t.id);

                    // Only proceed if we have tracks to update
                    if (videoTrackIds.length > 0 || audioTrackIds.length > 0) {
                        const filmScenesForSetup = await scenesApiInstance.scenes.getByFilm(filmId);
                        const setupPromises: Promise<any>[] = [];

                        for (const scene of filmScenesForSetup) {
                            const sceneRec = (scene as any).recording_setup;
                            // Upsert recording_setup for ALL scenes (create if missing, update if exists)
                            setupPromises.push(
                                scenesApiInstance.scenes.recordingSetup.upsert(scene.id, {
                                    camera_track_ids: videoTrackIds,
                                    audio_track_ids: audioTrackIds,
                                    graphics_enabled: sceneRec?.graphics_enabled ?? false,
                                }).catch((err: any) => console.warn(`[syncTracksFromPackage] Failed to upsert scene ${scene.id} recording setup:`, err))
                            );

                            // Upsert recording_setup for ALL moments (create if missing, update if exists)
                            const moments = (scene as any).moments || [];
                            for (const moment of moments) {
                                setupPromises.push(
                                    scenesApiInstance.moments.upsertRecordingSetup(moment.id, {
                                        camera_track_ids: videoTrackIds,
                                        camera_assignments: videoTrackIds.map((tid: number) => ({ track_id: tid })),
                                        audio_track_ids: audioTrackIds,
                                        graphics_enabled: moment.recording_setup?.graphics_enabled ?? false,
                                        graphics_title: moment.recording_setup?.graphics_title ?? null,
                                    }).catch((err: any) => console.warn(`[syncTracksFromPackage] Failed to upsert moment ${moment.id} recording setup:`, err))
                                );
                            }
                        }

                        if (setupPromises.length > 0) {
                            await Promise.all(setupPromises);
                            console.log(`[syncTracksFromPackage] Updated ${setupPromises.length} recording setups with track IDs: video=${videoTrackIds}, audio=${audioTrackIds}`);
                        }
                    }
                } catch (setupErr) {
                    console.warn('[syncTracksFromPackage] Could not sync recording setups:', setupErr);
                }

                // Final reload of tracks + equipment assignments
                const [finalTracks, finalAssignments] = await Promise.all([
                    api.films.tracks.getAll(filmId),
                    api.films.equipmentAssignments.getAll(filmId),
                ]);
                const transformedFinal = finalTracks.map((t: any) => transformBackendTrack(t));
                setTracks(transformedFinal);
                setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(finalAssignments));

                // ── Sync subjects from package ──────────────────────────────
                try {
                    const pkgSubjects = await api.schedule.packageEventDaySubjects.getAll(pkgId);
                    for (const pkgSubject of pkgSubjects) {
                        try {
                            await createSubject({
                                film_id: filmId,
                                name: pkgSubject.name,
                                category: pkgSubject.category || 'PEOPLE',
                                role_template_id: pkgSubject.role_template_id || undefined,
                                is_custom: false,
                            });
                        } catch {
                            // Ignore 400 duplicate — subject already exists on this film
                        }
                    }
                } catch (subjectErr) {
                    console.warn('Could not sync subjects from package:', subjectErr);
                }

                // ── Sync locations from package ─────────────────────────────
                try {
                    const pkgLocations = await api.schedule.packageEventDayLocations.getAll(pkgId);
                    for (const pkgLocation of pkgLocations) {
                        if (pkgLocation.location_id) {
                            try {
                                await api.filmLocations.addToFilm(filmId, { location_id: pkgLocation.location_id });
                            } catch {
                                // Ignore duplicate — location already linked to this film
                            }
                        }
                    }
                } catch (locationErr) {
                    console.warn('Could not sync locations from package:', locationErr);
                }

                // Reload film to pick up updated film.locations for the header count
                await loadAll();
            } catch (err) {
                console.error('Failed to sync tracks from package:', err);
            }
        };

        syncTracksFromPackage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        linkedActivityId={linkedActivityId ? Number(linkedActivityId) : undefined}
                        equipmentConfig={equipmentSummary || undefined}
                        equipmentAssignmentsBySlot={equipmentAssignmentsBySlot}
                    />
                </Box>
            </Box>
        </Box>
    );
}
