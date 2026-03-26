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
    lat?: number;
    lng?: number;
    precision?: 'EXACT' | 'APPROXIMATE';

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

// ==================== FILM LOCATION ASSIGNMENTS ====================

export interface FilmLocationAssignment {
    id: number;
    film_id: number;
    location_id: number;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    location: LocationsLibrary;
}

export interface FilmSceneLocationAssignment {
    id: number;
    scene_id: number;
    location_id: number;
    created_at: string;
    updated_at: string;
    location: LocationsLibrary;
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
    lat?: number;
    lng?: number;
    precision?: 'EXACT' | 'APPROXIMATE';
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    capacity?: number;
    notes?: string;
    brand_id?: number;
    is_active?: boolean;
}

export type UpdateLocationRequest = Partial<CreateLocationRequest>;

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

// ==================== FLOOR PLAN REQUESTS ====================

export interface CreateFloorPlanRequest {
    space_id: number;
    project_id?: number;
    name: string;
    fabric_data: Record<string, unknown>;
    layers_data?: Record<string, unknown>;
    is_default?: boolean;
    version?: number;
}

export type UpdateFloorPlanRequest = Partial<CreateFloorPlanRequest>;

export interface UpdateVenueFloorPlanRequest {
    venue_floor_plan_data: Record<string, unknown> | null;
}

// ==================== FLOOR PLAN OBJECTS ====================

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
}

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

// ==================== CATEGORIES ====================

export interface LocationCategory {
    id: number;
    name: string;
    description?: string;
}

export interface ObjectCategory {
    id: number;
    name: string;
    description?: string;
}
