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
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// Scene Moment interfaces
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
    music?: SceneMomentMusic; // Add music relationship
    coverage_assignments?: string; // Quick summary like "V1, V2, A1"
    coverage_items?: Array<{
        scene_id: number;
        coverage_id: number;
        moment_id?: number;
        priority_order: number;
        assignment?: string; // Assignment label like "V1", "V2", "A1"
        coverage: {
            id: number;
            name: string;
            description?: string;
            coverage_type: string;
            // Add other coverage fields as needed
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
export type SceneType = 'CEREMONY' | 'FIRST_DANCE' | 'RECEPTION' | 'PORTRAIT_SESSION';

export const SCENE_TYPE_OPTIONS: { value: SceneType; label: string }[] = [
    { value: 'CEREMONY', label: 'Ceremony' },
    { value: 'FIRST_DANCE', label: 'First Dance' },
    { value: 'RECEPTION', label: 'Reception' },
    { value: 'PORTRAIT_SESSION', label: 'Portrait Session' },
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
    // Parse formats like "5m 30s", "2m", "45s"
    const minutesMatch = durationString.match(/(\d+)m/);
    const secondsMatch = durationString.match(/(\d+)s/);

    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;

    return minutes * 60 + seconds;
};

export const getTotalMomentsDuration = (moments: SceneMoment[]): number => {
    return moments.reduce((total, moment) => total + (moment.duration || 0), 0);
};
