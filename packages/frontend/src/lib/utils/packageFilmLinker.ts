import { api, apiClient } from "@/lib/api";
import { ApiClient } from "@/lib/api/api-client.types";
import { request } from "@/hooks/utils/api";
import { createScenesApi } from "@/lib/api/scenes.api";

type TrackLike = {
    id: number;
    name?: string | null;
    type?: string | null;
    order_index?: number | null;
};

type SceneLike = {
    id: number;
    name: string;
    order_index?: number | null;
    scene_template_id?: number | null;
    template?: { id: number } | null;
    shot_count?: number | null;
    duration_seconds?: number | null;
    recording_setup?: {
        camera_track_ids?: number[];
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>;
    } | null;
    beats?: Array<{
        id: number;
        name: string;
        order_index?: number | null;
        shot_count?: number | null;
        duration_seconds?: number | null;
        recording_setup?: {
            camera_track_ids?: number[];
            audio_track_ids?: number[];
            graphics_enabled?: boolean;
        } | null;
    }>;
};

type EquipmentTemplateItem = {
    id: number;
    slot_type: 'CAMERA' | 'AUDIO';
    slot_index: number;
    equipment_id: number;
};

type EquipmentTemplate = {
    id: number;
    name: string;
    description?: string | null;
    items: EquipmentTemplateItem[];
};

const buildTrackIdMap = (templateTracks: TrackLike[], newTracks: TrackLike[]) => {
    const byTypeName = new Map<string, TrackLike>();
    const byTypeOrder = new Map<string, TrackLike>();

    for (const track of newTracks) {
        const typeKey = String(track.type || "").toUpperCase();
        const nameKey = String(track.name || "").toLowerCase();
        byTypeName.set(`${typeKey}|${nameKey}`, track);
        byTypeOrder.set(`${typeKey}|${track.order_index ?? 0}`, track);
    }

    const map = new Map<number, number>();
    for (const track of templateTracks) {
        const typeKey = String(track.type || "").toUpperCase();
        const nameKey = String(track.name || "").toLowerCase();
        const match = byTypeName.get(`${typeKey}|${nameKey}`) ||
            byTypeOrder.get(`${typeKey}|${track.order_index ?? 0}`);
        if (match?.id) {
            map.set(track.id, match.id);
        }
    }

    return map;
};

const mapTrackIds = (trackIdMap: Map<number, number>, ids?: number[]) =>
    (ids || [])
        .map((id) => trackIdMap.get(id))
        .filter((id): id is number => typeof id === "number");

const mapCameraAssignments = (
    trackIdMap: Map<number, number>,
    assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>
) => {
    if (!assignments) return undefined;
    const mapped = assignments
        .map((assignment) => {
            const newTrackId = trackIdMap.get(assignment.track_id);
            if (!newTrackId) return null;
            return {
                track_id: newTrackId,
                subject_ids: [] as number[],
                shot_type: assignment.shot_type ?? null,
            };
        })
        .filter((assignment): assignment is { track_id: number; subject_ids: number[]; shot_type: string | null } =>
            assignment !== null
        );

    return mapped.length > 0 ? mapped : undefined;
};

export const applyEquipmentTemplateToFilm = async (
    filmId: number,
    brandId: number,
    templateId?: number | null,
    counts?: { cameras?: number; audio?: number } | null
) => {
    if (!templateId) return;
    try {
        const templates = await request<EquipmentTemplate[]>(
            `/equipment/templates/brand/${brandId}`,
            {},
            { includeBrandQuery: false }
        );
        const template = templates.find((t) => t.id === templateId);
        if (!template || !Array.isArray(template.items)) return;

        const cameraSlots = template.items.filter((item) => item.slot_type === 'CAMERA');
        const audioSlots = template.items.filter((item) => item.slot_type === 'AUDIO');

        const inferredCameraCount = cameraSlots.reduce((max, item) => Math.max(max, item.slot_index), 0);
        const inferredAudioCount = audioSlots.reduce((max, item) => Math.max(max, item.slot_index), 0);

        const numCameras = typeof counts?.cameras === 'number' ? counts.cameras : inferredCameraCount;
        const numAudio = typeof counts?.audio === 'number' ? counts.audio : inferredAudioCount;

        await request(`/films/${filmId}/equipment`, {
            method: 'PATCH',
            body: JSON.stringify({
                num_cameras: numCameras,
                num_audio: numAudio,
                allow_removal: true,
            }),
        });

        const existingAssignments = await request<any[]>(
            `/films/${filmId}/equipment-assignments`
        );
        const assignedEquipmentIds = new Set(existingAssignments.map((a) => a.equipment_id));

        const eligibleItems = template.items.filter((item) => {
            if (item.slot_type === 'CAMERA') {
                return item.slot_index <= (numCameras || 0);
            }
            return item.slot_index <= (numAudio || 0);
        });

        for (const item of eligibleItems) {
            if (assignedEquipmentIds.has(item.equipment_id)) {
                continue;
            }
            const slotKey = `slot:${item.slot_type.toLowerCase()}-${item.slot_index}`;
            try {
                await request(`/films/${filmId}/equipment-assignments`, {
                    method: 'POST',
                    body: JSON.stringify({
                        equipment_id: item.equipment_id,
                        quantity: 1,
                        notes: slotKey,
                    }),
                });
                assignedEquipmentIds.add(item.equipment_id);
            } catch (assignError) {
                // Ignore duplicates or assignment failures per item
            }
        }
    } catch (error) {
        console.warn('Failed to apply equipment template to film:', error);
    }
};

export const createLinkedFilmFromTemplate = async ({
    templateFilmId,
    brandId,
    packageName,
    itemDescription,
    subjectTemplateId,
    equipmentTemplateId,
    equipmentCounts,
}: {
    templateFilmId: number;
    brandId: number;
    packageName?: string | null;
    itemDescription: string;
    subjectTemplateId?: number | null;
    equipmentTemplateId?: number | null;
    equipmentCounts?: { cameras?: number; audio?: number } | null;
}) => {
    const scenesApi = createScenesApi(apiClient as unknown as ApiClient);

    const applySubjectTemplateToFilm = async (filmId: number, templateId?: number | null) => {
        if (!templateId) return;
        try {
            const templates = await request<any[]>(
                `/subjects/roles/brand/${brandId}`,
                {},
                { includeBrandQuery: false }
            );
            const template = templates.find((t) => t.id === templateId);
            if (!template || !Array.isArray(template.roles)) return;

            for (const role of template.roles) {
                try {
                    await request(
                        `/subjects/films/${filmId}/subjects`,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                name: role.role_name,
                                category: template.category,
                                role_template_id: role.id,
                            }),
                        }
                    );
                } catch (roleError) {
                    // Ignore duplicates or individual role failures to keep flow moving
                }
            }
        } catch (error) {
            console.warn("Failed to apply subject template to film:", error);
        }
    };

    const templateFilm = await api.films.getById(templateFilmId);
    const templateTracks = (templateFilm?.tracks || []) as TrackLike[];

    const numCameras = templateTracks.filter((track) => String(track.type).toUpperCase() === "VIDEO").length;
    const numAudio = templateTracks.filter((track) => String(track.type).toUpperCase() === "AUDIO").length;

    const newFilm = await api.films.create({
        name: `${itemDescription} (${packageName || "Package"})`,
        brand_id: brandId,
        num_cameras: numCameras,
        num_audio: numAudio,
    });

    await applySubjectTemplateToFilm(newFilm.id, subjectTemplateId);
    await applyEquipmentTemplateToFilm(newFilm.id, brandId, equipmentTemplateId, equipmentCounts);

    const newTracks = (await api.films.tracks.getAll(newFilm.id)) as TrackLike[];
    const trackIdMap = buildTrackIdMap(templateTracks, newTracks);

    const templateScenes = (await api.scenes.getByFilm(templateFilmId)) as SceneLike[];
    const sortedScenes = [...(templateScenes || [])].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );

    for (const scene of sortedScenes) {
        const createdScene = await api.films.localScenes.create(newFilm.id, {
            name: scene.name,
            scene_template_id: scene.scene_template_id ?? scene.template?.id,
            order_index: scene.order_index ?? undefined,
            shot_count: scene.shot_count ?? null,
            duration_seconds: scene.duration_seconds ?? null,
        });

        if (scene.recording_setup) {
            await scenesApi.scenes.recordingSetup.upsert(createdScene.id, {
                camera_track_ids: mapTrackIds(trackIdMap, scene.recording_setup.camera_track_ids),
                audio_track_ids: mapTrackIds(trackIdMap, scene.recording_setup.audio_track_ids),
                graphics_enabled: scene.recording_setup.graphics_enabled ?? false,
            });
        }

        const templateMoments = await scenesApi.moments.getByScene(scene.id);
        for (const moment of templateMoments || []) {
            const createdMoment = await scenesApi.moments.create({
                film_scene_id: createdScene.id,
                name: moment.name,
                duration: moment.duration ?? 10,
                order_index: moment.order_index ?? 0,
            });

            if (moment.recording_setup) {
                const rs = moment.recording_setup as any;
                await scenesApi.moments.upsertRecordingSetup(createdMoment.id, {
                    camera_track_ids: mapTrackIds(trackIdMap, rs.camera_track_ids),
                    audio_track_ids: mapTrackIds(trackIdMap, rs.audio_track_ids),
                    graphics_enabled: rs.graphics_enabled ?? false,
                    graphics_title: rs.graphics_title ?? null,
                    camera_assignments: mapCameraAssignments(trackIdMap, rs.camera_assignments),
                });
            }
        }

        const templateBeats = scene.beats?.length
            ? scene.beats
            : await api.beats.getSceneBeats(scene.id);

        for (const beat of templateBeats || []) {
            const createdBeat = await api.beats.create(createdScene.id, {
                name: beat.name,
                duration_seconds: beat.duration_seconds ?? 10,
                order_index: beat.order_index ?? 0,
                shot_count: beat.shot_count ?? null,
            });

            if (beat.recording_setup) {
                await api.beats.recordingSetup.upsert(createdBeat.id, {
                    camera_track_ids: mapTrackIds(trackIdMap, beat.recording_setup.camera_track_ids),
                    audio_track_ids: mapTrackIds(trackIdMap, beat.recording_setup.audio_track_ids),
                    graphics_enabled: beat.recording_setup.graphics_enabled ?? false,
                });
            }
        }
    }

    return newFilm.id;
};
