import type { ApiClient } from '@/shared/api/client';
import type {
    LocationsLibrary,
    CreateLocationRequest,
    UpdateLocationRequest,
    FilmLocationAssignment,
    FilmSceneLocationAssignment,
    PackageLocationSlot,
    PackageEventDay,
    LocationCapacityFilter,
} from '../types';

export interface LocationsQueryParams {
    search?: string;
    city?: string;
    capacity?: Exclude<LocationCapacityFilter, 'all'>;
}

export type LocationsApi = ReturnType<typeof createLocationsApi>;

export const createLocationsApi = (client: ApiClient) => ({
    // ==================== LOCATIONS ====================

    getAll: (params?: LocationsQueryParams): Promise<LocationsLibrary[]> => {
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        if (params?.city) query.set('city', params.city);
        if (params?.capacity) query.set('capacity', params.capacity);
        const qs = query.toString();
        return client.get(qs ? `/api/locations?${qs}` : '/api/locations');
    },

    getById: (id: number): Promise<LocationsLibrary> =>
        client.get(`/api/locations/${id}`),

    create: (data: CreateLocationRequest): Promise<LocationsLibrary> =>
        client.post('/api/locations', data),

    update: (id: number, data: UpdateLocationRequest): Promise<LocationsLibrary> =>
        client.patch(`/api/locations/${id}`, data),

    delete: (id: number): Promise<void> =>
        client.delete(`/api/locations/${id}`),

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
        getAll: (packageId: number, eventDayId?: number): Promise<PackageLocationSlot[]> =>
            client.get(`/api/schedule/packages/${packageId}/location-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
    },

    packageEventDays: {
        getAll: (packageId: number): Promise<PackageEventDay[]> =>
            client.get(`/api/schedule/packages/${packageId}/event-days`),
    },
});
