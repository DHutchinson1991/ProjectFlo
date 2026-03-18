import { TrackType, SceneType } from "@prisma/client";

/**
 * Response DTO for film with all nested data (flat structure)
 * Matches Prisma Film model schema (refactor v2)
 */
export interface FilmResponseDto {
    id: number;
    name: string;
    brand_id: number;
    film_type: string;
    montage_preset_id: number | null;
    target_duration_min: number | null;
    target_duration_max: number | null;
    created_at: Date;
    updated_at: Date;
    
    // Nested data
    tracks: FilmTrackDto[];
    subjects: FilmSubjectDto[];
    locations?: FilmLocationDto[];
    scenes: FilmSceneDto[];
    montage_preset?: {
        id: number;
        name: string;
        min_duration_seconds: number;
        max_duration_seconds: number;
    } | null;
}

export interface FilmTrackDto {
    id: number;
    film_id: number;
    name: string;
    type: TrackType;
    order_index: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface FilmSubjectDto {
    id: number;
    film_id: number;
    name: string;
    category: string;
    is_custom: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface FilmLocationDto {
    id: number;
    film_id: number;
    location_id: number;
    notes?: string | null;
    created_at: Date;
    updated_at: Date;
    location: {
        id: number;
        name: string;
        address_line1?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
    };
}

export interface FilmSceneDto {
    id: number;
    film_id: number;
    scene_template_id: number | null;
    name: string;
    mode: SceneType;
    shot_count?: number | null;
    duration_seconds?: number | null;
    order_index: number;
    created_at: Date;
    updated_at: Date;
    location_assignment?: {
        id: number;
        scene_id: number;
        location_id: number;
        created_at: Date;
        updated_at: Date;
        location: {
            id: number;
            name: string;
            address_line1?: string | null;
            city?: string | null;
            state?: string | null;
            country?: string | null;
        };
    } | null;
    
    // Nested moments
    moments: SceneMomentDto[];
    beats?: SceneBeatDto[];
    scene_music?: {
        id: number;
        film_scene_id: number;
        music_name: string;
        artist: string | null;
        duration: number | null;
        music_type: string;
        created_at: Date;
        updated_at: Date;
    } | null;
    audio_sources?: SceneAudioSourceDto[];
}

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
