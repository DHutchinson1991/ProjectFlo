import { TrackType, SceneType } from "@prisma/client";
import { SceneMomentDto, SceneBeatDto, SceneAudioSourceDto } from "./scene-content.dto";

// Re-export for backward compat
export type { SceneMomentDto, SceneBeatDto, SceneAudioSourceDto } from "./scene-content.dto";

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
    role_template_id: number | null;
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
