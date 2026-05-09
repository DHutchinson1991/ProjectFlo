// ==================== BASE TYPES ====================

export interface LocationsLibrary {
    id: number;
    name: string;
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

    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    brand?: {
        id: number;
        name: string;
    };
    // Optional relation payloads
    film_locations?: Array<{ id: number }>;
    spaces?: LocationSpace[];
}

export interface LocationSpace {
    id: number;
    location_id: number;
    name: string;
    space_type?: string | null;
    capacity?: number | null;
    dimensions_length?: number | null;
    dimensions_width?: number | null;
    dimensions_height?: number | null;
    description?: string | null;
    indoor_outdoor?: 'INDOOR' | 'OUTDOOR' | 'PARTIALLY_COVERED' | null;
    natural_light?: 'ABUNDANT' | 'MODERATE' | 'LOW' | 'NONE' | null;
    flooring?: string | null;
    ceiling_style?: string | null;
    key_features?: string | null;
    accessibility_notes?: string | null;
    notes?: string | null;
    is_active: boolean;
    type_tags?: Array<{ id: number; space_type: string; description?: string | null }>;
    created_at: string;
    updated_at: string;
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

export type LocationCapacityFilter = 'all' | 'small' | 'medium' | 'large' | 'unknown';

// ==================== SCHEDULE SLOT TYPES ====================
// These live here temporarily — endpoints are at /api/schedule/packages/...

export interface PackageLocationSlot {
    id: number;
    package_id: number;
    location_id: number;
    event_day_id?: number | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface PackageEventDay {
    id: number;
    package_id: number;
    date: string;
    label?: string | null;
    created_at: string;
    updated_at: string;
}
