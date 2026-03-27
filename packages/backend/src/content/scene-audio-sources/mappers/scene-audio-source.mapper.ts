import { SceneAudioSource } from '@prisma/client';

export class SceneAudioSourceMapper {
    static toResponse(source: SceneAudioSource) {
        return {
            id: source.id,
            scene_id: source.scene_id,
            source_type: source.source_type,
            source_activity_id: source.source_activity_id,
            source_moment_id: source.source_moment_id,
            source_scene_id: source.source_scene_id,
            track_type: source.track_type,
            start_offset_seconds: source.start_offset_seconds,
            duration_seconds: source.duration_seconds,
            order_index: source.order_index,
            notes: source.notes,
            created_at: source.created_at,
            updated_at: source.updated_at,
        };
    }
}
