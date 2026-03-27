"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, CircularProgress, Alert, Button, Link, Stack } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import { ContentBuilder } from "@/features/content/content-builder";
import { FilmRightPanel } from "../components";
import { useFilmData, useFilmEquipment } from "../hooks";
import { useTimelineStorage, useTimelineSave } from "@/features/content/content-builder/hooks/data";
import { useFilmSubjects } from "@/features/content/subjects/hooks/useFilmSubjects";
import { useBrand } from "@/features/platform/brand";
import type { FilmEquipmentAssignmentsBySlot } from "../types/film-equipment.types";
import { servicePackagesApi } from "@/features/catalog/packages/api";
import { filmsApi } from "@/features/content/films/api";
import { crewSlotsApi, scheduleApi } from "@/features/workflow/scheduling/api";
import { locationsApi } from "@/features/workflow/locations/api";
import { scenesApi } from "@/features/content/scenes/api";
import { buildAssignmentsBySlot, buildEquipmentSlotKey, buildEquipmentSlotNote } from "@/features/content/films/utils/equipmentAssignments";
import { transformBackendTrack } from "@/features/content/films/utils/trackUtils";

interface FilmDetailScreenProps {
    filmId: number;
}

export function FilmDetailScreen({ filmId }: FilmDetailScreenProps) {
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
    } = useFilmData(filmId);

    const { saveTimeline, saveTracks } = useTimelineStorage(filmId);

    const {
        subjects,
        templates: subjectTemplates,
        createSubject,
        deleteSubject,
        loadTemplates,
    } = useFilmSubjects(filmId);

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

    // Handle film name save
    const handleSaveFilm = useCallback(async (newName: string) => {
        if (!film) return;
        try {
            const updated = await filmsApi.films.update(film.id, { name: newName });
            // Merge the updated data with existing film data to maintain all fields
            setFilm({ ...film, name: updated.name });
        } catch (err) {
            console.error("Failed to update film:", err);
            throw err;
        }
    }, [film, setFilm]);

    // Handle subject creation
    const handleAddSubject = useCallback(async (name: string, roleTemplateId?: number) => {
        try {
            await createSubject({
                film_id: filmId,
                name,
                role_template_id: roleTemplateId ?? 0,
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
                const assignments = await filmsApi.equipmentAssignments.getAll(filmId);
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
                    crewSlotsApi.packageDay.getAll(pkgId),
                    filmsApi.tracks.getAll(filmId),
                    servicePackagesApi.getById(pkgId).catch(() => null),
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
                    const crewId = op.crew_member_id ?? op.id;
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
                    await filmsApi.equipment.update(filmId, {
                        num_cameras: neededCameras,
                        num_audio: neededAudio,
                        allow_removal: true,
                    });
                }

                // Reload tracks to get their IDs
                const rawTracks = await filmsApi.tracks.getAll(filmId);

                // Assign crew_member_id to camera tracks and create equipment assignments
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
                    const needsCrewUpdate = track.crew_member_id !== opData.crewId;
                    const needsUnmannedUpdate = track.is_unmanned !== opData.isUnmanned;
                    console.log(`[syncTracksFromPackage] Track ${i}: crewId=${opData.crewId}, isUnmanned=${opData.isUnmanned}, eqId=${opData.cameraEquipmentId}, needsCrewUpdate=${needsCrewUpdate}, needsUnmannedUpdate=${needsUnmannedUpdate}`);
                    
                    if (needsCrewUpdate || needsUnmannedUpdate) {
                        assignmentPromises.push(
                            filmsApi.tracks.update(filmId, track.id, {
                                crew_member_id: opData.crewId,
                                is_unmanned: opData.isUnmanned,
                            })
                        );
                    }
                    if (opData.cameraEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('camera', i + 1));
                        assignmentPromises.push(
                            filmsApi.equipmentAssignments.assign(filmId, {
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
                    const needsCrewUpdate = track.crew_member_id !== audioData.crewId;
                    console.log(`[syncTracksFromPackage] Audio Track ${i}: crewId=${audioData.crewId}, eqId=${audioData.audioEquipmentId}, needsCrewUpdate=${needsCrewUpdate}`);

                    if (needsCrewUpdate) {
                        assignmentPromises.push(
                            filmsApi.tracks.update(filmId, track.id, {
                                crew_member_id: audioData.crewId,
                            })
                        );
                    }
                    if (audioData.audioEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('audio', i + 1));
                        assignmentPromises.push(
                            filmsApi.equipmentAssignments.assign(filmId, {
                                equipment_id: audioData.audioEquipmentId,
                                notes: slotNote,
                            }).catch(() => {/* ignore if already assigned */})
                        );
                    }
                }

                console.log('[syncTracksFromPackage] Making', assignmentPromises.length, 'assignment promises');

                // Wait for all track updates and equipment assignments to complete
                await Promise.all(assignmentPromises);

                try {
                    const videoTrackIds = rawTracks.filter((t: any) => t.type === 'VIDEO').map((t: any) => t.id);
                    const audioTrackIds = rawTracks.filter((t: any) => t.type === 'AUDIO').map((t: any) => t.id);

                    // Only proceed if we have tracks to update
                    if (videoTrackIds.length > 0 || audioTrackIds.length > 0) {
                        const filmScenesForSetup = await scenesApi.scenes.getByFilm(filmId);
                        const setupPromises: Promise<any>[] = [];

                        for (const scene of filmScenesForSetup) {
                            const sceneRec = (scene as any).recording_setup;
                            // Upsert recording_setup for ALL scenes (create if missing, update if exists)
                            setupPromises.push(
                                scenesApi.scenes.recordingSetup.upsert(scene.id, {
                                    camera_track_ids: videoTrackIds,
                                    audio_track_ids: audioTrackIds,
                                    graphics_enabled: sceneRec?.graphics_enabled ?? false,
                                }).catch((err: any) => console.warn(`[syncTracksFromPackage] Failed to upsert scene ${scene.id} recording setup:`, err))
                            );

                            // Upsert recording_setup for ALL moments (create if missing, update if exists)
                            const moments = (scene as any).moments || [];
                            for (const moment of moments) {
                                setupPromises.push(
                                    scenesApi.moments.upsertRecordingSetup(moment.id, {
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
                    filmsApi.tracks.getAll(filmId),
                    filmsApi.equipmentAssignments.getAll(filmId),
                ]);
                const transformedFinal = finalTracks.map((t: any) => transformBackendTrack(t));
                setTracks(transformedFinal);
                setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(finalAssignments));

                // ── Sync subjects from package ──────────────────────────────
                try {
                    const pkgSubjects = await scheduleApi.packageEventDaySubjects.getAll(pkgId) as Array<{
                        name: string;
                        role_template_id?: number | null;
                    }>;
                    for (const pkgSubject of pkgSubjects) {
                        try {
                            await createSubject({
                                film_id: filmId,
                                name: pkgSubject.name,
                                role_template_id: pkgSubject.role_template_id ?? 0,
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
                    const pkgLocations = await scheduleApi.packageEventDayLocations.getAll(pkgId) as Array<{
                        location_id?: number | null;
                    }>;
                    for (const pkgLocation of pkgLocations) {
                        if (pkgLocation.location_id) {
                            try {
                                await locationsApi.filmLocations.addToFilm(filmId, { location_id: pkgLocation.location_id });
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
