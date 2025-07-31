// Updated Coverage Types for Production-Focused System

export type CoverageType = 'VIDEO' | 'AUDIO';

export type ShotType =
    | 'WIDE_SHOT'
    | 'MEDIUM_SHOT'
    | 'CLOSE_UP'
    | 'EXTREME_CLOSE_UP'
    | 'OVER_SHOULDER'
    | 'TWO_SHOT'
    | 'ESTABLISHING_SHOT'
    | 'DETAIL_SHOT'
    | 'REACTION_SHOT'
    | 'CUTAWAY'
    | 'INSERT_SHOT'
    | 'MASTER_SHOT';

export type CameraMovement =
    | 'STATIC'
    | 'PAN'
    | 'TILT'
    | 'ZOOM'
    | 'TRACKING'
    | 'DOLLY'
    | 'GIMBAL_STABILIZED'
    | 'HANDHELD'
    | 'CRANE'
    | 'DRONE'
    | 'STEADICAM';

export type AudioEquipment =
    | 'LAPEL_MIC'
    | 'HANDHELD_MIC'
    | 'BOOM_MIC'
    | 'SHOTGUN_MIC'
    | 'AMBIENT_MIC'
    | 'WIRELESS_MIC'
    | 'RECORDER'
    | 'MIXING_BOARD';

export type VideoStyleType =
    | 'FULL'
    | 'MONTAGE'
    | 'CINEMATIC';

export interface Coverage {
    id: number;
    name: string;
    description?: string;
    coverage_type: CoverageType;

    // Video-specific fields
    shot_type?: ShotType;
    camera_movement?: CameraMovement;
    lens_focal_length?: string; // e.g., "24-70mm", "85mm", "50mm"
    aperture?: string; // e.g., "f/2.8", "f/1.4"
    video_style_type?: VideoStyleType; // New field: Full, Montage, or Cinematic style

    // Audio-specific fields
    audio_equipment?: AudioEquipment;
    audio_pattern?: string; // e.g., "Cardioid", "Omnidirectional", "Shotgun"
    frequency_response?: string; // e.g., "20Hz-20kHz", "80Hz-18kHz"

    // Common fields
    operator_id?: number;
    subject?: string; // e.g., "Bride", "Groom", "Both", "All Guests", "Officiant"
    notes?: string;

    // Equipment assignments (JSON for flexibility)
    equipment_assignments?: Record<string, unknown>;

    // Workflow and template integration
    workflow_template_id?: number;
    is_template?: boolean; // New field: Whether this is a template (true) or instance (false)

    // Metadata
    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    operator?: {
        id: number;
        contact: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
    workflow_template?: {
        id: number;
        name: string;
        description?: string;
    };
    scene_coverage?: SceneCoverage[];
}

export interface SceneCoverage {
    scene_id: number;
    coverage_id: number;

    // Override fields for scene-specific customization
    custom_subject?: string; // Override the default subject for this scene
    custom_operator_id?: number; // Override the default operator for this scene
    custom_notes?: string; // Additional notes specific to this scene
    priority_order: number; // Order priority within the scene

    // Metadata
    created_at: string;
    updated_at: string;

    // Relations
    scene?: {
        id: number;
        name: string;
        description?: string;
    };
    coverage?: Coverage;
    custom_operator?: {
        id: number;
        contact: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
}

export interface CreateCoverageDto {
    name: string;
    description?: string;
    coverage_type: CoverageType;

    // Video-specific fields
    shot_type?: ShotType;
    camera_movement?: CameraMovement;
    lens_focal_length?: string;
    aperture?: string;
    video_style_type?: VideoStyleType;

    // Audio-specific fields
    audio_equipment?: AudioEquipment;
    audio_pattern?: string;
    frequency_response?: string;

    // Common fields
    operator_id?: number;
    subject?: string;
    notes?: string;
    equipment_assignments?: Record<string, unknown>;
    workflow_template_id?: number;
    is_template?: boolean; // New field: Whether this is a template (true) or instance (false)
}

export interface UpdateCoverageDto {
    name?: string;
    description?: string;
    coverage_type?: CoverageType;

    // Video-specific fields
    shot_type?: ShotType;
    camera_movement?: CameraMovement;
    lens_focal_length?: string;
    aperture?: string;
    video_style_type?: VideoStyleType;

    // Audio-specific fields
    audio_equipment?: AudioEquipment;
    audio_pattern?: string;
    frequency_response?: string;

    // Common fields
    operator_id?: number;
    subject?: string;
    notes?: string;
    equipment_assignments?: Record<string, unknown>;
    workflow_template_id?: number;
    is_template?: boolean; // New field: Whether this is a template (true) or instance (false)
}

// Coverage Library Item interface (alias for Coverage)
export type CoverageLibraryItem = Coverage;

// Scene Coverage Assignment interface
export interface CreateSceneCoverageDto {
    scene_id: number;
    coverage_ids: number[];
}

export interface UpdateSceneCoverageDto {
    custom_subject?: string;
    custom_operator_id?: number;
    custom_notes?: string;
    priority_order?: number;
}
