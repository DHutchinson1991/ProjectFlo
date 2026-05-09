/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useEffect } from "react";
import { servicePackagesApi } from "@/features/catalog/packages/api";
import { filmsApi } from "@/features/content/films/api";
import { subjectsApi } from "@/features/content/subjects/api/subjects.api";
import { crewSlotsApi, scheduleApi } from "@/features/workflow/scheduling/api";
import { locationsApi } from "@/features/workflow/locations/api";
import { scenesApi } from "@/features/content/scenes/api";
import {
    buildAssignmentsBySlot,
    buildEquipmentSlotKey,
    buildEquipmentSlotNote,
} from "@/features/content/films/utils/equipmentAssignments";
import { transformBackendTrack } from "@/features/content/films/utils/trackUtils";
import type { FilmEquipmentAssignmentsBySlot } from "../types/film-equipment.types";

interface Params {
    filmId: number;
    linkedPackageId: string | null;
    /** Sync only fires once film data is available */
    filmReady: boolean;
    setTracks: (tracks: any[]) => void;
    setEquipmentAssignmentsBySlot: (val: FilmEquipmentAssignmentsBySlot) => void;
    createSubject: (data: { film_id: number; name: string; role_template_id: number | undefined }) => Promise<void>;
    loadAll: () => Promise<void>;
}

/**
 * Auto-syncs film tracks, equipment assignments, subjects and locations
 * from the linked package on first mount. Fires at most once per film+package pair.
 */
export function useFilmTrackSync({
    filmId,
    linkedPackageId,
    filmReady,
    setTracks,
    setEquipmentAssignmentsBySlot,
    createSubject,
    loadAll,
}: Params) {
    const hasSynced = useRef(false);

    useEffect(() => {
        if (!linkedPackageId || hasSynced.current || !filmReady) return;
        hasSynced.current = true;

        const run = async () => {
            try {
                const pkgId = Number(linkedPackageId);
                const [crewSlots, currentTracks, pkgData] = await Promise.all([
                    crewSlotsApi.packageDay.getAll(pkgId),
                    filmsApi.tracks.getAll(filmId),
                    servicePackagesApi.getById(pkgId).catch(() => null),
                ]);

                // Build ordered camera/audio lists from crew slot equipment
                const cameraCrew: { crewId: number | null; cameraEquipmentId: number | null; isUnmanned: boolean }[] = [];
                const audioEquipment: { crewId: number | null; audioEquipmentId: number }[] = [];
                const seenCameraIds = new Set<number>();
                const seenAudioIds = new Set<number>();
                const pendingUnmannedCams: { crewId: number | null; cameraEquipmentId: number; isUnmanned: boolean }[] = [];

                (crewSlots || []).forEach((op: any) => {
                    const crewId = op.crew_id ?? op.id;
                    (op.equipment?.length > 0 ? op.equipment : []).forEach((eq: any) => {
                        const cat = (eq.equipment?.category || "").toUpperCase();
                        const eqId = eq.equipment_id ?? eq.equipment?.id;
                        if (cat === "CAMERA" && eqId && !seenCameraIds.has(eqId)) {
                            seenCameraIds.add(eqId);
                            if (eq.equipment?.is_unmanned === true) {
                                pendingUnmannedCams.push({ crewId, cameraEquipmentId: eqId, isUnmanned: true });
                            } else {
                                cameraCrew.push({ crewId, cameraEquipmentId: eqId, isUnmanned: false });
                            }
                        } else if (cat === "AUDIO" && eqId && !seenAudioIds.has(eqId)) {
                            seenAudioIds.add(eqId);
                            audioEquipment.push({ crewId, audioEquipmentId: eqId });
                        }
                    });
                });

                // Pick up standalone cameras/audio from day_equipment
                const dayEquipMap = (pkgData?.contents as any)?.day_equipment || {};
                Object.values(dayEquipMap).forEach((items: any) => {
                    (items || []).forEach((item: any) => {
                        const eqId = item.equipment_id;
                        if (item.slot_type === "CAMERA" && eqId && !seenCameraIds.has(eqId)) {
                            seenCameraIds.add(eqId);
                            pendingUnmannedCams.push({ crewId: null, cameraEquipmentId: eqId, isUnmanned: true });
                        } else if (item.slot_type === "AUDIO" && eqId && !seenAudioIds.has(eqId)) {
                            seenAudioIds.add(eqId);
                            audioEquipment.push({ crewId: null, audioEquipmentId: eqId });
                        }
                    });
                });

                cameraCrew.push(...pendingUnmannedCams);

                const neededCameras = cameraCrew.length;
                const neededAudio = audioEquipment.length;
                const currentCameras = currentTracks.filter((t: any) => t.type === "VIDEO").length;
                const currentAudio = currentTracks.filter((t: any) => t.type === "AUDIO").length;

                // Reconcile track counts
                if (neededCameras !== currentCameras || neededAudio !== currentAudio) {
                    await filmsApi.equipment.update(filmId, {
                        num_cameras: neededCameras,
                        num_audio: neededAudio,
                        allow_removal: true,
                    });
                }

                const rawTracks = await filmsApi.tracks.getAll(filmId);
                const sortByNumber = (a: any, b: any) => {
                    const n = (t: any) => parseInt(t.name?.match(/(\d+)/)?.[1] || "0", 10);
                    return n(a) - n(b);
                };
                const videoTracks = rawTracks.filter((t: any) => t.type === "VIDEO").sort(sortByNumber);
                const audioTracks = rawTracks.filter((t: any) => t.type === "AUDIO").sort(sortByNumber);

                // Assign crew + equipment to camera tracks
                // Pre-load existing assignments to skip duplicates
                const existingAssignments = await filmsApi.equipmentAssignments.getAll(filmId);
                const assignedEquipmentIds = new Set(existingAssignments.map((a: any) => a.equipment_id ?? a.equipment?.id));

                const assignmentPromises: Promise<any>[] = [];
                for (let i = 0; i < videoTracks.length && i < cameraCrew.length; i++) {
                    const track = videoTracks[i];
                    const opData = cameraCrew[i];
                    if (track.crew_id !== opData.crewId || track.is_unmanned !== opData.isUnmanned) {
                        assignmentPromises.push(
                            filmsApi.tracks.update(filmId, track.id, {
                                crew_id: opData.crewId,
                                is_unmanned: opData.isUnmanned,
                            }),
                        );
                    }
                    if (opData.cameraEquipmentId && !assignedEquipmentIds.has(opData.cameraEquipmentId)) {
                        assignmentPromises.push(
                            filmsApi.equipmentAssignments.assign(filmId, {
                                equipment_id: opData.cameraEquipmentId,
                                notes: buildEquipmentSlotNote(buildEquipmentSlotKey("camera", i + 1)),
                            }).catch(() => { /* already assigned */ }),
                        );
                    }
                }

                // Assign crew + equipment to audio tracks
                for (let i = 0; i < audioTracks.length && i < audioEquipment.length; i++) {
                    const track = audioTracks[i];
                    const audioData = audioEquipment[i];
                    if (track.crew_id !== audioData.crewId) {
                        assignmentPromises.push(
                            filmsApi.tracks.update(filmId, track.id, { crew_id: audioData.crewId }),
                        );
                    }
                    if (audioData.audioEquipmentId && !assignedEquipmentIds.has(audioData.audioEquipmentId)) {
                        assignmentPromises.push(
                            filmsApi.equipmentAssignments.assign(filmId, {
                                equipment_id: audioData.audioEquipmentId,
                                notes: buildEquipmentSlotNote(buildEquipmentSlotKey("audio", i + 1)),
                            }).catch(() => { /* already assigned */ }),
                        );
                    }
                }

                await Promise.all(assignmentPromises);

                // Sync recording setups on all scenes + moments
                try {
                    const videoTrackIds = rawTracks.filter((t: any) => t.type === "VIDEO").map((t: any) => t.id);
                    const audioTrackIds = rawTracks.filter((t: any) => t.type === "AUDIO").map((t: any) => t.id);

                    if (videoTrackIds.length > 0 || audioTrackIds.length > 0) {
                        const filmScenes = await scenesApi.scenes.getByFilm(filmId);
                        const setupPromises: Promise<any>[] = [];

                        for (const scene of filmScenes) {
                            const sceneRec = (scene as any).recording_setup;
                            const existingSceneCameraIds = (sceneRec?.camera_assignments || []).map((a: any) => a.track_id).sort().join(',');
                            const existingSceneAudioIds = (sceneRec?.audio_track_ids || []).sort().join(',');
                            const newCameraIds = [...videoTrackIds].sort().join(',');
                            const newAudioIds = [...audioTrackIds].sort().join(',');

                            // Only upsert scene recording setup if tracks have changed
                            if (existingSceneCameraIds !== newCameraIds || existingSceneAudioIds !== newAudioIds) {
                                setupPromises.push(
                                    scenesApi.scenes.recordingSetup.upsert(scene.id, {
                                        camera_track_ids: videoTrackIds,
                                        audio_track_ids: audioTrackIds,
                                        graphics_enabled: sceneRec?.graphics_enabled ?? false,
                                    }).catch(() => { /* ignore */ }),
                                );
                            }
                            for (const moment of ((scene as any).moments || [])) {
                                // Preserve existing camera assignment data (subject_ids, shot_type)
                                // so the sync doesn't wipe user-configured assignments
                                const existingAssignments: any[] = moment.recording_setup?.camera_assignments || [];
                                const existingMomentCameraIds = existingAssignments.map((a: any) => a.track_id).sort().join(',');
                                const existingMomentAudioIds = (moment.recording_setup?.audio_track_ids || []).sort().join(',');

                                // Skip upsert if tracks already match — avoids deleting+recreating assignment rows
                                if (existingMomentCameraIds === newCameraIds && existingMomentAudioIds === newAudioIds) {
                                    continue;
                                }

                                const mergedAssignments = videoTrackIds.map((tid: number) => {
                                    const existing = existingAssignments.find((a: any) => a.track_id === tid);
                                    return {
                                        track_id: tid,
                                        subject_ids: existing?.subject_ids || [],
                                        shot_type: existing?.shot_type ?? null,
                                    };
                                });
                                setupPromises.push(
                                    scenesApi.moments.upsertRecordingSetup(moment.id, {
                                        camera_track_ids: videoTrackIds,
                                        camera_assignments: mergedAssignments,
                                        audio_track_ids: audioTrackIds,
                                        graphics_enabled: moment.recording_setup?.graphics_enabled ?? false,
                                        graphics_title: moment.recording_setup?.graphics_title ?? null,
                                    }).catch(() => { /* ignore */ }),
                                );
                            }
                        }
                        if (setupPromises.length > 0) await Promise.all(setupPromises);
                    }
                } catch {
                    // Non-fatal — recording setup sync failures don't block the rest
                }

                // Final reload of tracks + assignments (no loadAll — avoid full page re-render)
                const [finalTracks, finalAssignments] = await Promise.all([
                    filmsApi.tracks.getAll(filmId),
                    filmsApi.equipmentAssignments.getAll(filmId),
                ]);
                setTracks(finalTracks.map((t: any) => transformBackendTrack(t)));
                setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(finalAssignments));

                // Sync subjects from package (skip ones that already exist)
                try {
                    const [pkgSubjects, existingSubjects] = await Promise.all([
                        scheduleApi.packageEventDaySubjects.getAll(pkgId) as Promise<Array<{
                            name: string;
                            role_template_id?: number | null;
                        }>>,
                        subjectsApi.getSubjects(filmId).catch(() => []) as Promise<Array<{ name: string }>>,
                    ]);
                    const existingNames = new Set(existingSubjects.map((s: any) => s.name?.toLowerCase()));
                    for (const s of pkgSubjects) {
                        if (existingNames.has(s.name?.toLowerCase())) continue;
                        try {
                            await createSubject({ film_id: filmId, name: s.name, role_template_id: s.role_template_id ?? undefined });
                        } catch {
                            // Ignore 400 duplicate
                        }
                    }
                } catch { /* non-fatal */ }

                // Sync locations from package
                try {
                    const pkgLocations = await scheduleApi.packageEventDayLocations.getAll(pkgId) as Array<{
                        location_id?: number | null;
                    }>;
                    for (const loc of pkgLocations) {
                        if (loc.location_id) {
                            try {
                                await locationsApi.filmLocations.addToFilm(filmId, { location_id: loc.location_id });
                            } catch {
                                // Ignore duplicate
                            }
                        }
                    }
                } catch { /* non-fatal */ }
            } catch (err) {
                console.error("Failed to sync tracks from package:", err);
            }
        };

        run();
    }, [linkedPackageId, filmId, filmReady]);
}
