// ==================== BASE TYPES ====================

export interface LocationsLibrary {
    id: number;
    name: string;
    venue_name?: string; // Alias for name
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country: string;
    postal_code?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    capacity?: number;
    notes?: string;
    brand_id?: number;

    // Venue Floor Plan Fields
    venue_floor_plan_data?: Record<string, unknown> | null;
    venue_floor_plan_version: number;
    venue_floor_plan_updated_at?: string | null;
    venue_floor_plan_updated_by?: number | null;

    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    brand?: {
        id: number;
        name: string;
    };
    venue_floor_plan_updater?: {
        id: number;
        contact: {
            first_name?: string;
            last_name?: string;
            email: string;
        };
    };
    spaces?: LocationSpace[];
    scene_locations?: SceneLocationSpace[];

    // Computed fields
    _count?: {
        spaces: number;
        scene_locations: number;
    };
}

export interface LocationSpace {
    id: number;
    location_id: number;
    name: string;
    space_name?: string; // Alias for name
    space_type: string;
    capacity?: number;
    max_capacity?: number; // Alias for capacity
    dimensions_length?: number;
    dimensions_width?: number;
    dimensions_height?: number;
    dimensions_notes?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    location?: LocationsLibrary;
    floor_plans?: FloorPlan[];
    scene_locations?: SceneLocationSpace[];

    // Computed fields
    _count?: {
        floor_plans: number;
        scene_locations: number;
    };
}

export interface FloorPlan {
    id: number;
    space_id: number;
    project_id?: number;
    name: string;
    version: number;
    fabric_data: Record<string, unknown>;
    layers_data?: Record<string, unknown>;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by_id?: number;

    // Relations
    space?: LocationSpace;
    project?: {
        id: number;
        name: string;
    };
    created_by?: {
        id: number;
        first_name?: string;
        last_name?: string;
    };
}

export interface FloorPlanObject {
    id: number;
    name: string;
    category: string;
    object_type: string;
    fabric_template: Record<string, unknown>;
    thumbnail_url?: string;
    brand_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    brand?: {
        id: number;
        name: string;
    };
}

export interface SceneLocationSpace {
    id: number;
    scene_id: number;
    location_id: number;
    space_id: number;
    created_at: string;
    updated_at: string;

    // Relations
    scene?: {
        id: number;
        name: string;
    };
    location?: LocationsLibrary;
    space?: LocationSpace;
}

// ==================== CREATE/UPDATE TYPES ====================

export interface CreateLocationRequest {
    name: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    capacity?: number;
    notes?: string;
    brand_id?: number;
    is_active?: boolean;
}

export type UpdateLocationRequest = Partial<CreateLocationRequest>;

// ==================== VENUE FLOOR PLAN REQUESTS ====================

export interface UpdateVenueFloorPlanRequest {
    venue_floor_plan_data: Record<string, unknown>;
    venue_floor_plan_version?: number;
}

// ==================== LOCATION SPACE REQUESTS ====================

export interface CreateLocationSpaceRequest {
    location_id: number;
    name: string;
    space_name?: string; // Alias for name
    space_type: string;
    capacity?: number;
    dimensions_length?: number;
    dimensions_width?: number;
    dimensions_height?: number;
    dimensions_notes?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    notes?: string;
    is_active?: boolean;
}

export type UpdateLocationSpaceRequest = Partial<CreateLocationSpaceRequest>;

export interface CreateFloorPlanRequest {
    space_id: number;
    project_id?: number;
    name: string;
    version?: number;
    fabric_data: Record<string, unknown>;
    layers_data?: Record<string, unknown>;
    is_default?: boolean;
    is_active?: boolean;
    created_by_id?: number;
}

export type UpdateFloorPlanRequest = Partial<CreateFloorPlanRequest>;

export interface CreateFloorPlanObjectRequest {
    name: string;
    category: string;
    object_type: string;
    fabric_template: Record<string, unknown>;
    thumbnail_url?: string;
    brand_id?: number;
    is_active?: boolean;
}

export type UpdateFloorPlanObjectRequest = Partial<CreateFloorPlanObjectRequest>;

// ==================== QUERY PARAMETERS ====================

export interface LocationsQueryParams {
    brandId?: number;
}

export interface FloorPlansQueryParams {
    spaceId: number;
    projectId?: number;
}

export interface FloorPlanObjectsQueryParams {
    category?: string;
    brandId?: number;
}

// ==================== UTILITY TYPES ====================

export interface LocationCategory {
    space_type: string;
    count: number;
}

export interface ObjectCategory {
    category: string;
    count: number;
}

// ==================== FABRIC.JS TYPES ====================

export interface FabricCanvasData {
    version: string;
    objects: FabricObject[];
    background?: string;
    width?: number;
    height?: number;
}

export interface FabricObject {
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    angle?: number;
    scaleX?: number;
    scaleY?: number;
    flipX?: boolean;
    flipY?: boolean;
    opacity?: number;
    selectable?: boolean;
    evented?: boolean;
    [key: string]: unknown;
}

export interface FloorPlanLayer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    objects: string[]; // IDs of objects in this layer
}

// ==================== EDITOR STATE TYPES ====================

export interface FloorPlanEditorState {
    selectedObjectIds: string[];
    selectedLayerId?: string;
    tool: 'select' | 'pan' | 'zoom' | 'draw-rect' | 'draw-circle' | 'draw-line' | 'text';
    zoom: number;
    panX: number;
    panY: number;
    snapToGrid: boolean;
    gridSize: number;
    showGrid: boolean;
    showRulers: boolean;
}

export interface FloorPlanEditorConfig {
    canvasWidth: number;
    canvasHeight: number;
    minZoom: number;
    maxZoom: number;
    gridSize: number;
    snapThreshold: number;
}
