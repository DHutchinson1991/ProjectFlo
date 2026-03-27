import { useEffect, useRef } from 'react';
import { servicePackagesApi } from '@/features/catalog/packages/api';
import { filmsApi } from '@/features/content/films/api';
import { crewSlotsApi, scheduleApi } from '@/features/workflow/scheduling/api';
import { locationsApi } from '@/features/workflow/locations/api';
import { scenesApi } from '@/features/content/scenes/api';
import { buildAssignmentsBySlot, buildEquipmentSlotKey, buildEquipmentSlotNote } from '@/features/content/films/utils/equipmentAssignments';
import { transformBackendTrack } from '@/features/content/films/utils/trackUtils';
import type { TimelineTrack as ContentBuilderTrack } from '@/features/content/content-builder/types/timeline';
import type { Film } from '../types';
import type { FilmEquipmentAssignmentsBySlot } from '../types/film-equipment.types';

interface BackendTrackRecord {
    id: number;
    type?: string;
    name?: string | null;
    track_type?: string;
    track_label?: string | null;
    crew_member_id?: number | null;
    is_unmanned?: boolean | null;
}

interface PackageOperatorEquipmentRecord {
    equipment_id?: number | null;
    equipment?: {
        id?: number;
        category?: string | null;
        is_unmanned?: boolean | null;
    } | null;
}

interface PackageOperatorRecord {
    id: number;
    crew_member_id?: number | null;
    equipment?: PackageOperatorEquipmentRecord[];
}

interface PackageDayEquipmentRecord {
    equipment_id?: number | null;
    slot_type?: string | null;
}

interface PackageRecord {
    contents?: {
        day_equipment?: Record<string, PackageDayEquipmentRecord[] | undefined>;
    } | null;
}

interface RecordingSetupRecord {
    graphics_enabled?: boolean | null;
    graphics_title?: string | null;
}

interface MomentSetupRecord {
    id: number;
    recording_setup?: RecordingSetupRecord | null;
}

interface SceneSetupRecord {
    id: number;
    recording_setup?: RecordingSetupRecord | null;
    moments?: MomentSetupRecord[];
}

interface UsePackageTrackSyncOptions {
    filmId: number;
    film: Film | null;
    linkedPackageId: string | null;
    setTracks: React.Dispatch<React.SetStateAction<ContentBuilderTrack[]>>;
    setEquipmentAssignmentsBySlot: React.Dispatch<React.SetStateAction<FilmEquipmentAssignmentsBySlot>>;
    createSubject: (data: { film_id: number; name: string; role_template_id: number }) => Promise<unknown>;
    loadAll: () => Promise<void>;
}

export function usePackageTrackSync({
    filmId, film, linkedPackageId,
    setTracks, setEquipmentAssignmentsBySlot,
    createSubject, loadAll,
}: UsePackageTrackSyncOptions) {
    const hasSynced = useRef(false);

    useEffect(() => {
        if (!linkedPackageId || hasSynced.current) return;
        if (!film) return;
        hasSynced.current = true;

        const syncTracksFromPackage = async () => {
            try {
                const pkgId = Number(linkedPackageId);
                const [operators, currentTracks, pkgData] = await Promise.all([
                    crewSlotsApi.packageDay.getAll(pkgId) as Promise<PackageOperatorRecord[]>,
                    filmsApi.tracks.getAll(filmId) as Promise<BackendTrackRecord[]>,
                    servicePackagesApi.getById(pkgId).catch((): null => null) as Promise<PackageRecord | null>,
                ]);

                const cameraOperators: { crewId: number | null; cameraEquipmentId: number | null; isUnmanned: boolean }[] = [];
                const audioEquipment: { crewId: number | null; audioEquipmentId: number }[] = [];
                const seenCameraIds = new Set<number>();
                const seenAudioIds = new Set<number>();
                const pendingUnmannedCams: { crewId: number | null; cameraEquipmentId: number; isUnmanned: boolean }[] = [];

                (operators || []).forEach((op) => {
                    const crewId = op.crew_member_id ?? op.id;
                    const equipment = op.equipment ?? [];
                    equipment.forEach((eq) => {
                        const cat = (eq.equipment?.category || '').toUpperCase();
                        const eqId = eq.equipment_id ?? eq.equipment?.id;
                        if (cat === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) {
                            seenCameraIds.add(eqId);
                            if (eq.equipment?.is_unmanned === true) {
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

                const dayEquipMap = pkgData?.contents?.day_equipment || {};
                Object.values(dayEquipMap).forEach((items) => {
                    (items || []).forEach((item) => {
                        const eqId = item.equipment_id;
                        if (item.slot_type === 'CAMERA' && eqId && !seenCameraIds.has(eqId)) {
                            seenCameraIds.add(eqId);
                            pendingUnmannedCams.push({ crewId: null, cameraEquipmentId: eqId, isUnmanned: true });
                        } else if (item.slot_type === 'AUDIO' && eqId && !seenAudioIds.has(eqId)) {
                            seenAudioIds.add(eqId);
                            audioEquipment.push({ crewId: null, audioEquipmentId: eqId });
                        }
                    });
                });

                cameraOperators.push(...pendingUnmannedCams);

                const neededCameras = cameraOperators.length;
                const neededAudio = audioEquipment.length;
                const currentCameras = currentTracks.filter((t) => t.type === 'VIDEO').length;
                const currentAudioCount = currentTracks.filter((t) => t.type === 'AUDIO').length;

                if (neededCameras !== currentCameras || neededAudio !== currentAudioCount) {
                    await filmsApi.equipment.update(filmId, {
                        num_cameras: neededCameras, num_audio: neededAudio, allow_removal: true,
                    });
                }

                const rawTracks = await filmsApi.tracks.getAll(filmId) as BackendTrackRecord[];
                const videoTracks = rawTracks.filter((t) => t.type === 'VIDEO').sort((a, b) => {
                    const numA = parseInt(a.name?.match(/(\d+)/)?.[1] || '0', 10);
                    const numB = parseInt(b.name?.match(/(\d+)/)?.[1] || '0', 10);
                    return numA - numB;
                });

                const assignmentPromises: Array<Promise<unknown>> = [];
                for (let i = 0; i < videoTracks.length && i < cameraOperators.length; i++) {
                    const track = videoTracks[i];
                    const opData = cameraOperators[i];
                    if (track.crew_member_id !== opData.crewId || track.is_unmanned !== opData.isUnmanned) {
                        assignmentPromises.push(filmsApi.tracks.update(filmId, track.id, { crew_member_id: opData.crewId, is_unmanned: opData.isUnmanned }));
                    }
                    if (opData.cameraEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('camera', i + 1));
                        assignmentPromises.push(filmsApi.equipmentAssignments.assign(filmId, { equipment_id: opData.cameraEquipmentId, notes: slotNote }).catch(() => undefined));
                    }
                }

                const audioTracks = rawTracks.filter((t) => t.type === 'AUDIO').sort((a, b) => {
                    const numA = parseInt(a.name?.match(/(\d+)/)?.[1] || '0', 10);
                    const numB = parseInt(b.name?.match(/(\d+)/)?.[1] || '0', 10);
                    return numA - numB;
                });
                for (let i = 0; i < audioTracks.length && i < audioEquipment.length; i++) {
                    const track = audioTracks[i];
                    const audioData = audioEquipment[i];
                    if (track.crew_member_id !== audioData.crewId) {
                        assignmentPromises.push(filmsApi.tracks.update(filmId, track.id, { crew_member_id: audioData.crewId }));
                    }
                    if (audioData.audioEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('audio', i + 1));
                        assignmentPromises.push(filmsApi.equipmentAssignments.assign(filmId, { equipment_id: audioData.audioEquipmentId, notes: slotNote }).catch(() => undefined));
                    }
                }

                await Promise.all(assignmentPromises);

                try {
                    const videoTrackIds = rawTracks.filter((t) => t.type === 'VIDEO').map((t) => t.id);
                    const audioTrackIds = rawTracks.filter((t) => t.type === 'AUDIO').map((t) => t.id);

                    if (videoTrackIds.length > 0 || audioTrackIds.length > 0) {
                        const filmScenesForSetup = await scenesApi.scenes.getByFilm(filmId) as unknown as SceneSetupRecord[];
                        const setupPromises: Array<Promise<unknown>> = [];
                        for (const scene of filmScenesForSetup) {
                            const sceneRec = scene.recording_setup;
                            setupPromises.push(
                                scenesApi.scenes.recordingSetup.upsert(scene.id, {
                                    camera_track_ids: videoTrackIds, audio_track_ids: audioTrackIds,
                                    graphics_enabled: sceneRec?.graphics_enabled ?? false,
                                }).catch((err: unknown) => console.warn(`Failed to upsert scene ${scene.id} recording setup:`, err))
                            );
                            for (const moment of (scene.moments || [])) {
                                setupPromises.push(
                                    scenesApi.moments.upsertRecordingSetup(moment.id, {
                                        camera_track_ids: videoTrackIds,
                                        camera_assignments: videoTrackIds.map((tid: number) => ({ track_id: tid })),
                                        audio_track_ids: audioTrackIds,
                                        graphics_enabled: moment.recording_setup?.graphics_enabled ?? false,
                                        graphics_title: moment.recording_setup?.graphics_title ?? null,
                                    }).catch((err: unknown) => console.warn(`Failed to upsert moment ${moment.id} recording setup:`, err))
                                );
                            }
                        }
                        if (setupPromises.length > 0) await Promise.all(setupPromises);
                    }
                } catch (setupErr) {
                    console.warn('Could not sync recording setups:', setupErr);
                }

                const [finalTracks, finalAssignments] = await Promise.all([
                    filmsApi.tracks.getAll(filmId),
                    filmsApi.equipmentAssignments.getAll(filmId),
                ]);
                setTracks(finalTracks.map((t) => transformBackendTrack(t)));
                setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(finalAssignments));

                // Sync subjects
                try {
                    const pkgSubjects = await scheduleApi.packageEventDaySubjects.getAll(pkgId) as Array<{
                        name: string;
                        role_template_id?: number | null;
                    }>;
                    for (const pkgSubject of pkgSubjects) {
                        try {
                            await createSubject({ film_id: filmId, name: pkgSubject.name, role_template_id: pkgSubject.role_template_id ?? 0 });
                        } catch { /* duplicate */ }
                    }
                } catch (subjectErr) { console.warn('Could not sync subjects from package:', subjectErr); }

                // Sync locations
                try {
                    const pkgLocations = await scheduleApi.packageEventDayLocations.getAll(pkgId) as Array<{
                        location_id?: number | null;
                    }>;
                    for (const pkgLocation of pkgLocations) {
                        if (pkgLocation.location_id) {
                            try { await locationsApi.filmLocations.addToFilm(filmId, { location_id: pkgLocation.location_id }); }
                            catch { /* duplicate */ }
                        }
                    }
                } catch (locationErr) { console.warn('Could not sync locations from package:', locationErr); }

                await loadAll();
            } catch (err) {
                console.error('Failed to sync tracks from package:', err);
            }
        };

        syncTracksFromPackage();
    }, [linkedPackageId, filmId, film, setTracks, setEquipmentAssignmentsBySlot, createSubject, loadAll]);
}
