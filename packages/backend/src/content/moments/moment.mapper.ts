export interface MomentResponseDto {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    duration: number;
    created_at: Date;
    updated_at: Date;
}

export function mapToMomentResponse(moment: {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    duration: number;
    created_at: Date;
    updated_at: Date;
}): MomentResponseDto {
    return {
        id: moment.id,
        film_scene_id: moment.film_scene_id,
        name: moment.name,
        order_index: moment.order_index,
        duration: moment.duration,
        created_at: moment.created_at,
        updated_at: moment.updated_at,
    };
}

export function buildRecordingSetupResponse(recording: {
    id: number;
    audio_track_ids: number[];
    graphics_enabled: boolean;
    graphics_title?: string | null;
    camera_assignments: Array<{
        track_id: number;
        subject_ids: number[];
        track?: { name: string; type: string } | null;
    }>;
}) {
    return {
        id: recording.id,
        audio_track_ids: recording.audio_track_ids,
        graphics_enabled: recording.graphics_enabled,
        graphics_title: recording.graphics_title ?? null,
        camera_assignments: recording.camera_assignments.map(a => ({
            track_id: a.track_id,
            track_name: a.track?.name || String(a.track_id),
            track_type: a.track?.type ? String(a.track.type) : undefined,
            subject_ids: a.subject_ids,
            shot_type: 'shot_type' in a ? (a as { shot_type?: unknown }).shot_type ?? undefined : undefined,
        })),
    };
}
