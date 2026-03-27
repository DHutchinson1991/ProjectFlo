import { BeatResponseDto } from '../types/beat.types';

type BeatWithRecordingSetup = {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    shot_count: number | null;
    duration_seconds: number;
    source_activity_id: number | null;
    source_moment_id: number | null;
    source_scene_id: number | null;
    created_at: Date;
    updated_at: Date;
    recording_setup?: {
        id: number;
        camera_track_ids: number[];
        audio_track_ids: number[];
        graphics_enabled: boolean;
        created_at: Date;
        updated_at: Date;
    } | null;
};

export class BeatMapper {
    static toResponse(beat: BeatWithRecordingSetup): BeatResponseDto {
        return {
            id: beat.id,
            film_scene_id: beat.film_scene_id,
            name: beat.name,
            order_index: beat.order_index,
            shot_count: beat.shot_count ?? null,
            duration_seconds: beat.duration_seconds,
            source_activity_id: beat.source_activity_id ?? null,
            source_moment_id: beat.source_moment_id ?? null,
            source_scene_id: beat.source_scene_id ?? null,
            created_at: beat.created_at,
            updated_at: beat.updated_at,
            recording_setup: beat.recording_setup
                ? {
                      id: beat.recording_setup.id,
                      camera_track_ids: beat.recording_setup.camera_track_ids,
                      audio_track_ids: beat.recording_setup.audio_track_ids,
                      graphics_enabled: beat.recording_setup.graphics_enabled,
                      created_at: beat.recording_setup.created_at,
                      updated_at: beat.recording_setup.updated_at,
                  }
                : null,
        };
    }
}
