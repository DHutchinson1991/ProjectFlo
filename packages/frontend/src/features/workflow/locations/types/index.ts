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
