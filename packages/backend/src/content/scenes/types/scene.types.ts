import { SceneType, MontageStyle } from '@prisma/client';

export interface SceneResponseDto {
    id: number;
    film_id: number;
    name: string;
    mode: SceneType;
    scene_template_id: number | null;
    shot_count?: number | null;
    duration_seconds?: number | null;
    montage_style?: MontageStyle | null;
    montage_bpm?: number | null;
    order_index: number;
    created_at: Date;
    updated_at: Date;
}

export interface CameraAssignmentSummary {
    track_id: number;
    track_name: string;
    track_type?: string;
    subject_ids: number[];
    shot_type?: string | null;
}

export interface RecordingSetupSummary {
    id: number;
    audio_track_ids: number[];
    graphics_enabled: boolean;
    graphics_title?: string | null;
    camera_track_ids?: number[];
    camera_assignments?: CameraAssignmentSummary[];
    created_at?: Date;
    updated_at?: Date;
}

export interface BeatSummary {
    id: number;
    film_scene_id: number;
    name: string;
    order_index: number;
    shot_count?: number | null;
    duration_seconds: number;
    recording_setup?: RecordingSetupSummary | null;
    created_at: Date;
    updated_at: Date;
}

export interface TemplateSummary {
    id: number;
    name: string;
    type: SceneType;
}

export interface SceneMusicSummary {
    id: number;
    film_scene_id: number;
    music_name: string;
    artist: string;
    duration: number;
    music_type: string;
    created_at: Date;
    updated_at: Date;
}
