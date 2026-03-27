import type { ApiClient } from '@/shared/api/client';
import type {
    LocationsLibrary,
    LocationSpace,
    FloorPlan,
    FloorPlanObject,
    CreateLocationRequest,
    UpdateLocationRequest,
    CreateLocationSpaceRequest,
    UpdateLocationSpaceRequest,
    CreateFloorPlanRequest,
    UpdateFloorPlanRequest,
    UpdateVenueFloorPlanRequest,
    CreateFloorPlanObjectRequest,
    UpdateFloorPlanObjectRequest,
    FilmLocationAssignment,
    FilmSceneLocationAssignment,
} from '../types';

export const createLocationsApi = (client: ApiClient) => ({
    // ==================== LOCATIONS ====================

    getAll: (): Promise<LocationsLibrary[]> =>
        client.get('/api/locations'),

    getById: (id: number): Promise<LocationsLibrary> =>
        client.get(`/api/locations/${id}`),

    create: (data: CreateLocationRequest): Promise<LocationsLibrary> =>
        client.post('/api/locations', data),

    update: (id: number, data: UpdateLocationRequest): Promise<LocationsLibrary> =>
        client.patch(`/api/locations/${id}`, data),

    delete: (id: number): Promise<void> =>
        client.delete(`/api/locations/${id}`),

    // ==================== VENUE FLOOR PLAN ====================

    getVenueFloorPlan: (locationId: number): Promise<{
        venue_floor_plan_data: Record<string, unknown> | null;
        venue_floor_plan_version: number;
        venue_floor_plan_updated_at: string | null;
        venue_floor_plan_updated_by: number | null;
    }> => client.get(`/api/locations/${locationId}/venue-floor-plan`),

    updateVenueFloorPlan: (locationId: number, data: UpdateVenueFloorPlanRequest): Promise<LocationsLibrary> =>
        client.patch(`/api/locations/${locationId}/venue-floor-plan`, data),

    resetVenueFloorPlan: (locationId: number): Promise<LocationsLibrary> =>
        client.delete(`/api/locations/${locationId}/venue-floor-plan`),

    // ==================== SPACES ====================

    getSpaces: (locationId: number): Promise<LocationSpace[]> =>
        client.get(`/api/locations/${locationId}/spaces`),

    getSpace: (id: number): Promise<LocationSpace> =>
        client.get(`/api/locations/spaces/${id}`),

    createSpace: (data: CreateLocationSpaceRequest): Promise<LocationSpace> =>
        client.post('/api/locations/spaces', data),

    updateSpace: (id: number, data: UpdateLocationSpaceRequest): Promise<LocationSpace> =>
        client.patch(`/api/locations/spaces/${id}`, data),

    deleteSpace: (id: number): Promise<void> =>
        client.delete(`/api/locations/spaces/${id}`),

    // ==================== FLOOR PLANS ====================

    getFloorPlans: (spaceId: number, projectId?: number): Promise<FloorPlan[]> => {
        const query = projectId ? `?project_id=${projectId}` : '';
        return client.get(`/api/locations/spaces/${spaceId}/floor-plans${query}`);
    },

    getFloorPlan: (id: number): Promise<FloorPlan> =>
        client.get(`/api/locations/floor-plans/${id}`),

    createFloorPlan: (data: CreateFloorPlanRequest): Promise<FloorPlan> =>
        client.post('/api/locations/floor-plans', data),

    updateFloorPlan: (id: number, data: UpdateFloorPlanRequest): Promise<FloorPlan> =>
        client.patch(`/api/locations/floor-plans/${id}`, data),

    deleteFloorPlan: (id: number): Promise<void> =>
        client.delete(`/api/locations/floor-plans/${id}`),

    duplicateFloorPlan: (id: number, projectId?: number): Promise<FloorPlan> =>
        client.post(`/api/locations/floor-plans/${id}/duplicate`, { project_id: projectId }),

    // ==================== FLOOR PLAN OBJECTS ====================

    getFloorPlanObjects: (category?: string): Promise<FloorPlanObject[]> => {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        return client.get(`/api/locations/floor-plan-objects${query}`);
    },

    getFloorPlanObject: (id: number): Promise<FloorPlanObject> =>
        client.get(`/api/locations/floor-plan-objects/${id}`),

    createFloorPlanObject: (data: CreateFloorPlanObjectRequest): Promise<FloorPlanObject> =>
        client.post('/api/locations/floor-plan-objects', data),

    updateFloorPlanObject: (id: number, data: UpdateFloorPlanObjectRequest): Promise<FloorPlanObject> =>
        client.patch(`/api/locations/floor-plan-objects/${id}`, data),

    deleteFloorPlanObject: (id: number): Promise<void> =>
        client.delete(`/api/locations/floor-plan-objects/${id}`),

    // ==================== CATEGORIES ====================

    getSpaceCategories: (): Promise<Array<{ space_type: string; count: number }>> =>
        client.get('/api/locations/categories/spaces'),

    getObjectCategories: (): Promise<Array<{ category: string; count: number }>> =>
        client.get('/api/locations/categories/objects'),

    // ==================== FILM LOCATIONS ====================

    filmLocations: {
        getByFilm: (filmId: number): Promise<FilmLocationAssignment[]> =>
            client.get(`/api/film-locations/films/${filmId}/locations`),

        addToFilm: (filmId: number, data: { location_id: number; notes?: string }): Promise<FilmLocationAssignment> =>
            client.post(`/api/film-locations/films/${filmId}/locations`, data),

        removeFromFilm: (filmId: number, locationId: number): Promise<void> =>
            client.delete(`/api/film-locations/films/${filmId}/locations/${locationId}`),

        getSceneLocation: (sceneId: number): Promise<FilmSceneLocationAssignment | null> =>
            client.get(`/api/film-locations/scenes/${sceneId}/location`),

        setSceneLocation: (sceneId: number, data: { location_id: number }): Promise<FilmSceneLocationAssignment> =>
            client.put(`/api/film-locations/scenes/${sceneId}/location`, data),

        clearSceneLocation: (sceneId: number): Promise<void> =>
            client.delete(`/api/film-locations/scenes/${sceneId}/location`),
    },

    // ==================== PACKAGE LOCATION SLOTS ====================

    packageLocationSlots: {
        getAll: (packageId: number, eventDayId?: number): Promise<any[]> =>
            client.get(`/api/schedule/packages/${packageId}/location-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
    },

    packageEventDays: {
        getAll: (packageId: number): Promise<any[]> =>
            client.get(`/api/schedule/packages/${packageId}/event-days`),
    },
});

export type LocationsApi = ReturnType<typeof createLocationsApi>;
