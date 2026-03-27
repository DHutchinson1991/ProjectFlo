export interface BeatResponseDto {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    shot_count?: number | null;
    duration_seconds: number;
    source_activity_id?: number | null;
    source_moment_id?: number | null;
    source_scene_id?: number | null;
    created_at: Date;
    updated_at: Date;
    recording_setup?: BeatRecordingSetupDto | null;
}

export interface BeatRecordingSetupDto {
    id: number;
    camera_track_ids: number[];
    audio_track_ids: number[];
    graphics_enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
