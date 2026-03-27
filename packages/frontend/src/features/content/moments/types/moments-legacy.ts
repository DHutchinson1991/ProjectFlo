/**
 * Legacy Moment Types — Canonical source.
 * Used by MomentsApiService and MusicLibrary feature.
 *
 * NOTE: These are distinct from the newer SceneMoment in ./index.ts (which uses film_scene_id).
 * These use the older scene_id field and are consumed by the moments/music API layer.
 */

// Moment Template interfaces
export interface MomentTemplate {
    id: number;
    name: string;
    description?: string;
    scene_type?: string;
    order_index: number;
    default_duration?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateMomentTemplateDto {
    name: string;
    description?: string;
    scene_type?: string;
    order_index: number;
    default_duration?: number;
    is_active?: boolean;
}

export interface UpdateMomentTemplateDto {
    name?: string;
    description?: string;
    scene_type?: string;
    order_index?: number;
    default_duration?: number;
    is_active?: boolean;
}

// Music types
export type MusicType = 'NONE' | 'SCENE_MATCHED' | 'ORCHESTRAL' | 'PIANO' | 'MODERN' | 'VINTAGE';

export interface SceneMomentMusic {
    id: number;
    moment_id: number;
    music_library_item_id?: number;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// SceneMoment (legacy variant — uses scene_id, not film_scene_id like the newer SceneMoment in ./index.ts)
export interface SceneMoment {
    id: number;
    scene_id: number;
    project_id?: number;
    template_id?: number;
    name: string;
    description?: string;
    order_index: number;
    duration?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    template?: MomentTemplate;
    music?: SceneMomentMusic;
    coverage_assignments?: string;
    coverage_items?: Array<{
        scene_id: number;
        coverage_id: number;
        moment_id?: number;
        priority_order: number;
        assignment?: string;
        coverage: {
            id: number;
            name: string;
            description?: string;
            coverage_type: string;
        };
    }>;
}

export interface CreateSceneMomentDto {
    scene_id: number;
    project_id?: number;
    template_id?: number;
    name: string;
    description?: string;
    order_index: number;
    duration?: number;
    is_active?: boolean;
}

export interface UpdateSceneMomentDto {
    name?: string;
    description?: string;
    order_index?: number;
    duration?: number;
    is_active?: boolean;
}

export interface CreateSceneMomentMusicDto {
    moment_id: number;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
}

export interface UpdateSceneMomentMusicDto {
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type?: MusicType;
    file_path?: string;
    notes?: string;
}

export interface ReorderMomentsDto {
    moment_ids: number[];
}

// Drag and Drop interfaces
export interface DraggedMoment {
    id: number;
    index: number;
    moment: SceneMoment;
}

// API Response types
export interface MomentsApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// Scene types for moment templates
export type SceneType = 'MOMENTS' | 'MONTAGE';

export const SCENE_TYPE_OPTIONS: { value: SceneType; label: string }[] = [
    { value: 'MOMENTS', label: 'Moments' },
    { value: 'MONTAGE', label: 'Montage' },
];

// Music type options
export const MUSIC_TYPE_OPTIONS: { value: MusicType; label: string }[] = [
    { value: 'NONE', label: 'No Music' },
    { value: 'SCENE_MATCHED', label: 'Scene Matched' },
    { value: 'ORCHESTRAL', label: 'Orchestral' },
    { value: 'PIANO', label: 'Piano' },
    { value: 'MODERN', label: 'Modern' },
    { value: 'VINTAGE', label: 'Vintage' },
];

// Helper functions
export const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
        return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
        return `${minutes}m`;
    } else {
        return `${minutes}m ${remainingSeconds}s`;
    }
};

export const parseDuration = (durationString: string): number => {
    const minutesMatch = durationString.match(/(\d+)m/);
    const secondsMatch = durationString.match(/(\d+)s/);

    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;

    return minutes * 60 + seconds;
};

export const getTotalMomentsDuration = (moments: SceneMoment[]): number => {
    return moments.reduce((total, moment) => total + (moment.duration || 0), 0);
};
