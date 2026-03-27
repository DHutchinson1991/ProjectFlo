export interface SceneAudioSourceDto {
    id: number;
    scene_id: number;
    source_type: string;
    source_activity_id: number | null;
    source_moment_id: number | null;
    source_scene_id: number | null;
    track_type: string;
    start_offset_seconds: number | null;
    duration_seconds: number | null;
    order_index: number;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface SceneBeatDto {
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
    recording_setup?: {
        id: number;
        camera_track_ids: number[];
        audio_track_ids: number[];
        graphics_enabled: boolean;
        created_at: Date;
        updated_at: Date;
    } | null;
}

export interface SceneMomentDto {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    duration: number;
    created_at: Date;
    updated_at: Date;
    has_recording_setup?: boolean;
    recording_setup?: {
        id: number;
        audio_track_ids: number[];
        graphics_enabled: boolean;
        graphics_title?: string | null;
        camera_assignments: Array<{
            track_id: number;
            track_name?: string;
            track_type?: string;
            subject_ids: number[];
            shot_type?: string | null;
        }>;
    } | null;
    moment_music?: {
        id: number;
        moment_id: number;
        music_name: string;
        artist: string | null;
        duration: number | null;
        music_type: string;
        overrides_scene_music: boolean;
        created_at: Date;
        updated_at: Date;
    } | null;
}
