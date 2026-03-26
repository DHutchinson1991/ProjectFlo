import { useEffect, useRef, useCallback } from 'react';
import { api, apiClient } from '@/lib/api';
import { createScenesApi } from '@/features/content/scenes/api';
import { buildAssignmentsBySlot, buildEquipmentSlotKey, buildEquipmentSlotNote } from '@/lib/utils/equipmentAssignments';
import { transformBackendTrack } from '@/lib/utils/trackUtils';
import type { Film } from '../types';
import type { FilmEquipmentAssignmentsBySlot } from '../types/film-equipment.types';
import type { ApiClient } from '@/lib/api/api-client.types';

interface UsePackageTrackSyncOptions {
    filmId: number;
    film: Film | null;
    linkedPackageId: string | null;
    setTracks: React.Dispatch<React.SetStateAction<any[]>>;
    setEquipmentAssignmentsBySlot: React.Dispatch<React.SetStateAction<FilmEquipmentAssignmentsBySlot>>;
    createSubject: (data: { film_id: number; name: string; role_template_id?: number }) => Promise<any>;
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
                    api.operators.packageDay.getAll(pkgId),
                    api.films.tracks.getAll(filmId),
                    api.servicePackages.getOne(film.brand_id, pkgId).catch(() => null),
                ]);

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

                const dayEquipMap = (pkgData?.contents as any)?.day_equipment || {};
                Object.values(dayEquipMap).forEach((items: any) => {
                    (items || []).forEach((item: any) => {
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
                const currentCameras = currentTracks.filter((t: any) => t.type === 'VIDEO').length;
                const currentAudioCount = currentTracks.filter((t: any) => t.type === 'AUDIO').length;

                if (neededCameras !== currentCameras || neededAudio !== currentAudioCount) {
                    await api.films.equipment.update(filmId, {
                        num_cameras: neededCameras, num_audio: neededAudio, allow_removal: true,
                    });
                }

                const rawTracks = await api.films.tracks.getAll(filmId);
                const videoTracks = rawTracks.filter((t: any) => t.type === 'VIDEO').sort((a: any, b: any) => {
                    const numA = parseInt(a.name?.match(/(\d+)/)?.[1] || '0', 10);
                    const numB = parseInt(b.name?.match(/(\d+)/)?.[1] || '0', 10);
                    return numA - numB;
                });

                const assignmentPromises: Promise<any>[] = [];
                for (let i = 0; i < videoTracks.length && i < cameraOperators.length; i++) {
                    const track = videoTracks[i];
                    const opData = cameraOperators[i];
                    if (track.contributor_id !== opData.crewId || track.is_unmanned !== opData.isUnmanned) {
                        assignmentPromises.push(api.films.tracks.update(filmId, track.id, { contributor_id: opData.crewId, is_unmanned: opData.isUnmanned }));
                    }
                    if (opData.cameraEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('camera', i + 1));
                        assignmentPromises.push(api.films.equipmentAssignments.assign(filmId, { equipment_id: opData.cameraEquipmentId, notes: slotNote }).catch(() => {}));
                    }
                }

                const audioTracks = rawTracks.filter((t: any) => t.type === 'AUDIO').sort((a: any, b: any) => {
                    const numA = parseInt(a.name?.match(/(\d+)/)?.[1] || '0', 10);
                    const numB = parseInt(b.name?.match(/(\d+)/)?.[1] || '0', 10);
                    return numA - numB;
                });
                for (let i = 0; i < audioTracks.length && i < audioEquipment.length; i++) {
                    const track = audioTracks[i];
                    const audioData = audioEquipment[i];
                    if (track.contributor_id !== audioData.crewId) {
                        assignmentPromises.push(api.films.tracks.update(filmId, track.id, { contributor_id: audioData.crewId }));
                    }
                    if (audioData.audioEquipmentId) {
                        const slotNote = buildEquipmentSlotNote(buildEquipmentSlotKey('audio', i + 1));
                        assignmentPromises.push(api.films.equipmentAssignments.assign(filmId, { equipment_id: audioData.audioEquipmentId, notes: slotNote }).catch(() => {}));
                    }
                }

                await Promise.all(assignmentPromises);

                // Sync recording setups
                try {
                    const scenesApiInstance = createScenesApi(apiClient as unknown as ApiClient);
                    const videoTrackIds = rawTracks.filter((t: any) => t.type === 'VIDEO').map((t: any) => t.id);
                    const audioTrackIds = rawTracks.filter((t: any) => t.type === 'AUDIO').map((t: any) => t.id);

                    if (videoTrackIds.length > 0 || audioTrackIds.length > 0) {
                        const filmScenesForSetup = await scenesApiInstance.scenes.getByFilm(filmId);
                        const setupPromises: Promise<any>[] = [];
                        for (const scene of filmScenesForSetup) {
                            const sceneRec = (scene as any).recording_setup;
                            setupPromises.push(
                                scenesApiInstance.scenes.recordingSetup.upsert(scene.id, {
                                    camera_track_ids: videoTrackIds, audio_track_ids: audioTrackIds,
                                    graphics_enabled: sceneRec?.graphics_enabled ?? false,
                                }).catch((err: any) => console.warn(`Failed to upsert scene ${scene.id} recording setup:`, err))
                            );
                            for (const moment of ((scene as any).moments || [])) {
                                setupPromises.push(
                                    scenesApiInstance.moments.upsertRecordingSetup(moment.id, {
                                        camera_track_ids: videoTrackIds,
                                        camera_assignments: videoTrackIds.map((tid: number) => ({ track_id: tid })),
                                        audio_track_ids: audioTrackIds,
                                        graphics_enabled: moment.recording_setup?.graphics_enabled ?? false,
                                        graphics_title: moment.recording_setup?.graphics_title ?? null,
                                    }).catch((err: any) => console.warn(`Failed to upsert moment ${moment.id} recording setup:`, err))
                                );
                            }
                        }
                        if (setupPromises.length > 0) await Promise.all(setupPromises);
                    }
                } catch (setupErr) {
                    console.warn('Could not sync recording setups:', setupErr);
                }

                const [finalTracks, finalAssignments] = await Promise.all([
                    api.films.tracks.getAll(filmId),
                    api.films.equipmentAssignments.getAll(filmId),
                ]);
                setTracks(finalTracks.map((t: any) => transformBackendTrack(t)));
                setEquipmentAssignmentsBySlot(buildAssignmentsBySlot(finalAssignments));

                // Sync subjects
                try {
                    const pkgSubjects = await api.schedule.packageEventDaySubjects.getAll(pkgId);
                    for (const pkgSubject of pkgSubjects) {
                        try {
                            await createSubject({ film_id: filmId, name: pkgSubject.name, role_template_id: pkgSubject.role_template_id || undefined });
                        } catch { /* duplicate */ }
                    }
                } catch (subjectErr) { console.warn('Could not sync subjects from package:', subjectErr); }

                // Sync locations
                try {
                    const pkgLocations = await api.schedule.packageEventDayLocations.getAll(pkgId);
                    for (const pkgLocation of pkgLocations) {
                        if (pkgLocation.location_id) {
                            try { await api.filmLocations.addToFilm(filmId, { location_id: pkgLocation.location_id }); }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linkedPackageId, filmId, setTracks, film]);
}
