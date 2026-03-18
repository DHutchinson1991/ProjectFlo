const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// ==================== TYPES ====================

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
    is_active: boolean;
    created_at: string;
    updated_at: string;
    spaces?: LocationSpace[];
    brand?: unknown;
    _count?: {
        spaces: number;
        scene_locations: number;
    };
}

export interface LocationSpace {
    id: number;
    location_id: number;
    name: string;
    space_type: string;
    capacity?: number;
    dimensions_length?: number;
    dimensions_width?: number;
    dimensions_height?: number;
    metadata?: Record<string, unknown>;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    location?: LocationsLibrary;
    floor_plans?: FloorPlan[];
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
    fabric_data: Record<string, unknown>; // Fabric.js canvas data
    layers_data?: Record<string, unknown>; // Layer information
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by_id?: number;
    space?: LocationSpace;
    project?: unknown;
    created_by?: unknown;
}

export interface FloorPlanObject {
    id: number;
    name: string;
    category: string;
    object_type: string;
    fabric_template: Record<string, unknown>; // Fabric.js object template
    thumbnail_url?: string;
    brand_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    brand?: unknown;
}

// ==================== DTOs ====================

export interface CreateLocationDto {
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

export interface UpdateLocationDto {
    name?: string;
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

export interface UpdateVenueFloorPlanDto {
    venue_floor_plan_data: Record<string, unknown>;
    venue_floor_plan_version?: number;
}

export interface CreateLocationSpaceDto {
    location_id: number;
    name: string;
    space_type: string;
    capacity?: number;
    dimensions_length?: number;
    dimensions_width?: number;
    dimensions_height?: number;
    metadata?: Record<string, unknown>;
    notes?: string;
    is_active?: boolean;
}

export interface UpdateLocationSpaceDto {
    name?: string;
    space_type?: string;
    capacity?: number;
    dimensions_length?: number;
    dimensions_width?: number;
    dimensions_height?: number;
    metadata?: Record<string, unknown>;
    notes?: string;
    is_active?: boolean;
}

export interface CreateFloorPlanDto {
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

export interface UpdateFloorPlanDto {
    project_id?: number;
    name?: string;
    version?: number;
    fabric_data?: Record<string, unknown>;
    layers_data?: Record<string, unknown>;
    is_default?: boolean;
    is_active?: boolean;
    created_by_id?: number;
}

export interface CreateFloorPlanObjectDto {
    name: string;
    category: string;
    object_type: string;
    fabric_template: Record<string, unknown>;
    thumbnail_url?: string;
    brand_id?: number;
    is_active?: boolean;
}

export interface UpdateFloorPlanObjectDto {
    name?: string;
    category?: string;
    object_type?: string;
    fabric_template?: Record<string, unknown>;
    thumbnail_url?: string;
    brand_id?: number;
    is_active?: boolean;
}

// ==================== API SERVICE ====================

class LocationsApiService {
    // ==================== LOCATIONS ====================

    async getLocations(brandId?: number): Promise<LocationsLibrary[]> {
        const queryParams = brandId ? `?brand_id=${brandId}` : '';
        const response = await fetch(`${API_BASE_URL}/locations${queryParams}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch locations: ${response.status}`);
        }
        return response.json();
    }

    async getLocation(id: number): Promise<LocationsLibrary> {
        const response = await fetch(`${API_BASE_URL}/locations/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch location: ${response.status}`);
        }
        return response.json();
    }

    async createLocation(data: CreateLocationDto): Promise<LocationsLibrary> {
        const response = await fetch(`${API_BASE_URL}/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create location: ${response.status}`);
        }
        return response.json();
    }

    async updateLocation(id: number, data: UpdateLocationDto): Promise<LocationsLibrary> {
        const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update location: ${response.status}`);
        }
        return response.json();
    }

    async deleteLocation(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete location: ${response.status}`);
        }
    }

    // ==================== VENUE FLOOR PLAN METHODS ====================

    async updateVenueFloorPlan(locationId: number, data: UpdateVenueFloorPlanDto): Promise<LocationsLibrary> {
        console.log('🌐 API: updateVenueFloorPlan called with:', {
            locationId,
            dataKeys: Object.keys(data),
            dataSize: JSON.stringify(data).length
        });

        const response = await fetch(`${API_BASE_URL}/locations/${locationId}/venue-floor-plan`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        console.log('🌐 API: updateVenueFloorPlan response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('🌐 API: updateVenueFloorPlan error response:', errorText);
            throw new Error(`Failed to update venue floor plan: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🌐 API: updateVenueFloorPlan success response:', {
            venue_floor_plan_version: result.venue_floor_plan_version,
            venue_floor_plan_updated_at: result.venue_floor_plan_updated_at,
            venue_floor_plan_data_exists: !!result.venue_floor_plan_data
        });

        return result;
    }

    async getVenueFloorPlan(locationId: number): Promise<{
        venue_floor_plan_data: Record<string, unknown> | null;
        venue_floor_plan_version: number;
        venue_floor_plan_updated_at: string | null;
        venue_floor_plan_updated_by: number | null;
    }> {
        const response = await fetch(`${API_BASE_URL}/locations/${locationId}/venue-floor-plan`);

        if (!response.ok) {
            throw new Error(`Failed to get venue floor plan: ${response.status}`);
        }
        return response.json();
    }

    async resetVenueFloorPlan(locationId: number): Promise<LocationsLibrary> {
        const response = await fetch(`${API_BASE_URL}/locations/${locationId}/venue-floor-plan`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to reset venue floor plan: ${response.status}`);
        }
        return response.json();
    }

    // ==================== LOCATION SPACES ====================

    async getLocationSpaces(locationId: number): Promise<LocationSpace[]> {
        const response = await fetch(`${API_BASE_URL}/locations/${locationId}/spaces`);
        if (!response.ok) {
            throw new Error(`Failed to fetch location spaces: ${response.status}`);
        }
        return response.json();
    }

    async getLocationSpace(id: number): Promise<LocationSpace> {
        const response = await fetch(`${API_BASE_URL}/locations/spaces/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch location space: ${response.status}`);
        }
        return response.json();
    }

    async createLocationSpace(data: CreateLocationSpaceDto): Promise<LocationSpace> {
        const response = await fetch(`${API_BASE_URL}/locations/spaces`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create location space: ${response.status}`);
        }
        return response.json();
    }

    async updateLocationSpace(id: number, data: UpdateLocationSpaceDto): Promise<LocationSpace> {
        const response = await fetch(`${API_BASE_URL}/locations/spaces/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update location space: ${response.status}`);
        }
        return response.json();
    }

    async deleteLocationSpace(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/locations/spaces/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete location space: ${response.status}`);
        }
    }

    // ==================== FLOOR PLANS ====================

    async getFloorPlans(spaceId: number, projectId?: number): Promise<FloorPlan[]> {
        const queryParams = projectId ? `?project_id=${projectId}` : '';
        const response = await fetch(`${API_BASE_URL}/locations/spaces/${spaceId}/floor-plans${queryParams}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch floor plans: ${response.status}`);
        }
        return response.json();
    }

    async getFloorPlan(id: number): Promise<FloorPlan> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plans/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch floor plan: ${response.status}`);
        }
        return response.json();
    }

    async createFloorPlan(data: CreateFloorPlanDto): Promise<FloorPlan> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create floor plan: ${response.status}`);
        }
        return response.json();
    }

    async updateFloorPlan(id: number, data: UpdateFloorPlanDto): Promise<FloorPlan> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plans/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update floor plan: ${response.status}`);
        }
        return response.json();
    }

    async deleteFloorPlan(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plans/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete floor plan: ${response.status}`);
        }
    }

    async duplicateFloorPlan(id: number, projectId?: number): Promise<FloorPlan> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plans/${id}/duplicate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ project_id: projectId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to duplicate floor plan: ${response.status}`);
        }
        return response.json();
    }

    // ==================== FLOOR PLAN OBJECTS ====================

    async getFloorPlanObjects(category?: string, brandId?: number): Promise<FloorPlanObject[]> {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (brandId) params.append('brand_id', brandId.toString());

        const queryString = params.toString();
        const response = await fetch(`${API_BASE_URL}/locations/floor-plan-objects${queryString ? `?${queryString}` : ''}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch floor plan objects: ${response.status}`);
        }
        return response.json();
    }

    async getFloorPlanObject(id: number): Promise<FloorPlanObject> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plan-objects/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch floor plan object: ${response.status}`);
        }
        return response.json();
    }

    async createFloorPlanObject(data: CreateFloorPlanObjectDto): Promise<FloorPlanObject> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plan-objects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create floor plan object: ${response.status}`);
        }
        return response.json();
    }

    async updateFloorPlanObject(id: number, data: UpdateFloorPlanObjectDto): Promise<FloorPlanObject> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plan-objects/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update floor plan object: ${response.status}`);
        }
        return response.json();
    }

    async deleteFloorPlanObject(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/locations/floor-plan-objects/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete floor plan object: ${response.status}`);
        }
    }

    // ==================== UTILITY METHODS ====================

    async getLocationCategories(): Promise<Array<{ space_type: string; count: number }>> {
        const response = await fetch(`${API_BASE_URL}/locations/categories/spaces`);
        if (!response.ok) {
            throw new Error(`Failed to fetch location categories: ${response.status}`);
        }
        return response.json();
    }

    async getObjectCategories(): Promise<Array<{ category: string; count: number }>> {
        const response = await fetch(`${API_BASE_URL}/locations/categories/objects`);
        if (!response.ok) {
            throw new Error(`Failed to fetch object categories: ${response.status}`);
        }
        return response.json();
    }
}

export const locationsApi = new LocationsApiService();
