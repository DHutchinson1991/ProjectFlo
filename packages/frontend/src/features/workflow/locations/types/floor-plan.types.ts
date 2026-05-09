// ==================== FLOOR PLAN TYPES ====================

export type FloorPlanObjectType =
    | 'WALL' | 'DOOR' | 'WINDOW'
    | 'TABLE_ROUND' | 'TABLE_RECT' | 'TABLE_HEAD'
    | 'CHAIR_ROW' | 'STAGE' | 'AISLE' | 'ARCH' | 'ALTAR'
    | 'DANCE_FLOOR' | 'BAR' | 'DJ_BOOTH'
    | 'FURNITURE' | 'DECORATIVE' | 'LABEL';

export interface FloorPlanObject {
    id: number;
    floor_plan_id: number;
    object_type: FloorPlanObjectType;
    label?: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    metadata?: Record<string, unknown> | null;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface SpaceZone {
    id: number;
    name: string;
    floor_plan_id: number | null;
    boundary_json: Array<{ x: number; y: number }> | null;
    fill_color: string | null;
    dimensions_length: number | null;
    dimensions_width: number | null;
    capacity: number | null;
    indoor_outdoor: 'INDOOR' | 'OUTDOOR' | 'PARTIALLY_COVERED' | null;
    type_tags: Array<{ id: number; space_type: string }>;
}

export interface FloorPlan {
    id: number;
    location_id: number;
    name: string;
    canvas_width: number;
    canvas_height: number;
    layout_json: Record<string, unknown> | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    objects: FloorPlanObject[];
    space_zones: SpaceZone[];
}

// ==================== SCENE SPATIAL TYPES ====================

export interface SceneCameraPosition {
    id: number;
    scene_id: number;
    track_id: number;
    space_id: number;
    x: number;
    y: number;
    rotation: number;
    focal_length_mm: number | null;
    is_unmanned: boolean;
    label: string | null;
    created_at: string;
    updated_at: string;
    track: { id: number; name: string; type: string; is_unmanned?: boolean };
    space: { id: number; name: string };
}

export interface SceneSubjectPosition {
    id: number;
    scene_id: number;
    subject_id: number;
    space_id: number;
    x: number;
    y: number;
    label: string | null;
    created_at: string;
    updated_at: string;
    subject: {
        id: number;
        name: string;
        role_template?: { role_name: string } | null;
    };
    space: { id: number; name: string };
}

export interface SceneSpaceAssignment {
    id: number;
    scene_id: number;
    space_id: number;
    order_index: number;
    space: {
        id: number;
        name: string;
        type_tags: Array<{ id: number; space_type: string }>;
        location: { id: number; name: string };
    };
}

export interface SceneSpatialLayout {
    spaces: SceneSpaceAssignment[];
    cameras: SceneCameraPosition[];
    subjects: SceneSubjectPosition[];
}

// ==================== MOMENT SPATIAL TYPES (Keyframe Overrides) ====================

export interface MomentCameraPosition {
    id: number;
    moment_id: number;
    track_id: number;
    space_id: number;
    source_scene_position_id: number | null;
    x: number;
    y: number;
    rotation: number;
    focal_length_mm: number | null;
    is_unmanned: boolean;
    label: string | null;
    created_at: string;
    updated_at: string;
    track: { id: number; name: string; type: string; is_unmanned?: boolean };
    space: { id: number; name: string };
    source: { id: number; x: number; y: number; rotation: number } | null;
}

export interface MomentSubjectPosition {
    id: number;
    moment_id: number;
    subject_id: number;
    space_id: number;
    source_scene_position_id: number | null;
    x: number;
    y: number;
    label: string | null;
    created_at: string;
    updated_at: string;
    subject: {
        id: number;
        name: string;
        role_template?: { role_name: string } | null;
    };
    space: { id: number; name: string };
    source: { id: number; x: number; y: number } | null;
}

export interface MomentSpatialLayout {
    cameras: MomentCameraPosition[];
    subjects: MomentSubjectPosition[];
}

export interface UpsertMomentCameraPositionRequest {
    track_id: number;
    space_id: number;
    x: number;
    y: number;
    rotation?: number;
    focal_length_mm?: number;
    is_unmanned?: boolean;
    label?: string;
    source_scene_position_id?: number;
}

export interface UpsertMomentSubjectPositionRequest {
    subject_id: number;
    space_id: number;
    x: number;
    y: number;
    label?: string;
    source_scene_position_id?: number;
}

// ==================== REQUEST TYPES ====================

export interface SaveFloorPlanCanvasRequest {
    layout_json?: Record<string, unknown>;
    objects?: Array<{
        id?: number;
        object_type: FloorPlanObjectType;
        label?: string;
        x: number;
        y: number;
        width?: number;
        height?: number;
        rotation?: number;
        metadata?: Record<string, unknown>;
        order_index?: number;
    }>;
}

export interface UpsertCameraPositionRequest {
    track_id: number;
    space_id: number;
    x: number;
    y: number;
    rotation?: number;
    focal_length_mm?: number;
    is_unmanned?: boolean;
    label?: string;
}

export interface UpsertSubjectPositionRequest {
    subject_id: number;
    space_id: number;
    x: number;
    y: number;
    label?: string;
}

// ==================== FACING TARGET ====================

export type FacingTargetType = 'ANGLE' | 'SUBJECT' | 'OBJECT';

// ==================== SPACE SLOT SPATIAL TYPES ====================

export interface SpaceSlotObject {
    id: number;
    package_space_slot_id: number;
    object_type: FloorPlanObjectType;
    label?: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    metadata?: Record<string, unknown> | null;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface SpaceSlotMomentOverride {
    id: number;
    moment_id: number;
    x: number;
    y: number;
    rotation: number;
    fov_angle?: number | null;
    facing_target_type?: FacingTargetType | null;
    facing_target_id?: number | null;
}

export interface SpaceSlotCameraPosition {
    id: number;
    package_space_slot_id: number;
    crew_slot_id: number | null;
    label: string | null;
    x: number;
    y: number;
    rotation: number;
    focal_length_mm: number | null;
    fov_angle: number | null;
    is_unmanned: boolean;
    facing_target_type: FacingTargetType;
    facing_target_id: number | null;
    order_index: number;
    created_at: string;
    updated_at: string;
    crew_slot?: {
        id: number;
        label?: string | null;
        job_role?: { id: number; name: string; display_name?: string };
    } | null;
    moment_overrides?: SpaceSlotMomentOverride[];
}

export interface SpaceSlotSubjectPosition {
    id: number;
    package_space_slot_id: number;
    day_subject_id: number | null;
    label: string | null;
    x: number;
    y: number;
    rotation: number;
    bound_object_id: number | null;
    bound_offset_x: number;
    bound_offset_y: number;
    facing_target_type: FacingTargetType;
    facing_target_id: number | null;
    order_index: number;
    created_at: string;
    updated_at: string;
    day_subject?: {
        id: number;
        name: string;
        role_template_id?: number | null;
    } | null;
    bound_object?: {
        id: number;
        label: string | null;
        object_type: FloorPlanObjectType;
        x: number;
        y: number;
    } | null;
    moment_overrides?: SpaceSlotMomentOverride[];
}

export interface SpaceSlotZone {
    id: number;
    package_space_slot_id: number;
    name: string;
    label: string | null;
    polygon: Array<{ x: number; y: number }>;
    color: string | null;
    description: string | null;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface SpaceSlotTypeTag {
    id: number;
    package_space_slot_id: number;
    space_type: string;
}

export interface PackageSpaceSlot {
    id: number;
    package_id: number;
    event_day_template_id: number;
    label: string;
    description?: string | null;
    location_slot_id: number | null;
    location_space_id: number | null;
    preset_id: number | null;
    canvas_width: number;
    canvas_height: number;
    layout_json: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    objects: SpaceSlotObject[];
    camera_positions: SpaceSlotCameraPosition[];
    subject_positions: SpaceSlotSubjectPosition[];
    zones: SpaceSlotZone[];
    type_tags: SpaceSlotTypeTag[];
}

// ==================== SPACE SLOT SAVE REQUESTS ====================

export interface SaveSpaceSlotCanvasRequest {
    layout_json?: Record<string, unknown>;
    canvas_width?: number;
    canvas_height?: number;
    objects?: Array<{
        id?: number;
        object_type: FloorPlanObjectType;
        label?: string;
        x: number;
        y: number;
        width?: number;
        height?: number;
        rotation?: number;
        metadata?: Record<string, unknown>;
        order_index?: number;
    }>;
    cameras?: Array<{
        id?: number;
        crew_slot_id?: number;
        label?: string;
        x: number;
        y: number;
        rotation?: number;
        focal_length_mm?: number;
        fov_angle?: number;
        is_unmanned?: boolean;
        facing_target_type?: FacingTargetType;
        facing_target_id?: number;
        order_index?: number;
    }>;
    subjects?: Array<{
        id?: number;
        day_subject_id?: number;
        label?: string;
        x: number;
        y: number;
        rotation?: number;
        bound_object_id?: number;
        bound_offset_x?: number;
        bound_offset_y?: number;
        facing_target_type?: FacingTargetType;
        facing_target_id?: number;
        order_index?: number;
    }>;
}

// ==================== SPATIAL CONTEXT (AI) ====================

export interface SpatialContextCamera {
    id: number;
    label: string | null;
    crew_slot: string | null;
    x: number;
    y: number;
    rotation: number;
    fov_angle: number | null;
    focal_length_mm: number | null;
    facing: FacingTargetType;
}

export interface SpatialContextSubject {
    id: number;
    label: string | null;
    day_subject: string | null;
    x: number;
    y: number;
    rotation: number;
    bound_to: { object_id: number; label: string | null; type: FloorPlanObjectType } | null;
    facing: FacingTargetType;
}

export interface SpatialContextZone {
    name: string;
    label: string | null;
    description: string | null;
    polygon: Array<{ x: number; y: number }>;
}

export interface SpatialContext {
    slot_id: number;
    label: string;
    canvas: { width: number; height: number };
    zones: SpatialContextZone[];
    objects: Array<{
        id: number;
        type: FloorPlanObjectType;
        label: string | null;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>;
    cameras: SpatialContextCamera[];
    subjects: SpatialContextSubject[];
}
