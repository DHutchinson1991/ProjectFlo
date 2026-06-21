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
        id: number;
        track_id: number;
        subject_ids: number[];
        shot_type?: unknown;
        shot_type_locked?: boolean;
        shot_coupling?: unknown;
        enabled?: boolean;
        track?: { name: string; type: string } | null;
    }>;
}) {
    // Split assignments into camera vs audio based on track type
    const cameraAssignments = recording.camera_assignments.filter(
        a => !a.track?.type || a.track.type.toUpperCase() !== 'AUDIO',
    );
    const audioAssignments = recording.camera_assignments.filter(
        a => a.track?.type?.toUpperCase() === 'AUDIO',
    );

    return {
        id: recording.id,
        audio_track_ids: recording.audio_track_ids,
        graphics_enabled: recording.graphics_enabled,
        graphics_title: recording.graphics_title ?? null,
        camera_assignments: cameraAssignments.map(a => ({
            id: a.id,
            track_id: a.track_id,
            track_name: a.track?.name || String(a.track_id),
            track_type: a.track?.type ? String(a.track.type) : undefined,
            subject_ids: a.subject_ids,
            shot_type: 'shot_type' in a ? (a as { shot_type?: unknown }).shot_type ?? undefined : undefined,
            shot_type_locked: 'shot_type_locked' in a ? (a as { shot_type_locked?: boolean }).shot_type_locked ?? false : false,
            shot_coupling: 'shot_coupling' in a ? (a as { shot_coupling?: unknown }).shot_coupling ?? undefined : undefined,
            enabled: 'enabled' in a ? (a as { enabled?: boolean }).enabled : true,
        })),
        audio_assignments: audioAssignments.map(a => ({
            id: a.id,
            track_id: a.track_id,
            track_name: a.track?.name || String(a.track_id),
            subject_ids: a.subject_ids,
        })),
    };
}
