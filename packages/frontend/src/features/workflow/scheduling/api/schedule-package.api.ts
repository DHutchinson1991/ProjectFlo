import type { ApiClient } from '@/shared/api/client';

// ─── Package Schedule API ─────────────────────────────────────────────────────

export function createSchedulePackageApi(client: ApiClient) {
    return {
        packageEventDays: {
            getAll: (packageId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/${packageId}/event-days`),
            add: (packageId: number, eventDayId: number): Promise<unknown> =>
                client.post(`/api/schedule/packages/${packageId}/event-days`, { event_day_template_id: eventDayId }),
            remove: (packageId: number, eventDayId: number): Promise<void> =>
                client.delete(`/api/schedule/packages/${packageId}/event-days/${eventDayId}`),
            set: (packageId: number, eventDayIds: number[]): Promise<unknown[]> =>
                client.post(`/api/schedule/packages/${packageId}/event-days/set`, { event_day_template_ids: eventDayIds }),
        },

        packageActivities: {
            getAll: (packageId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/${packageId}/activities`),
            getByDay: (packageId: number, packageEventDayId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/${packageId}/activities/day/${packageEventDayId}`),
            create: (packageId: number, data: {
                package_event_day_id: number;
                name: string;
                description?: string;
                color?: string;
                icon?: string;
                start_time?: string;
                end_time?: string;
                duration_minutes?: number;
                order_index?: number;
            }): Promise<unknown> =>
                client.post(`/api/schedule/packages/${packageId}/activities`, data),
            update: (activityId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/packages/activities/${activityId}`, data),
            delete: (activityId: number): Promise<void> =>
                client.delete(`/api/schedule/packages/activities/${activityId}`),
            reorder: (packageId: number, packageEventDayId: number, activityIds: number[]): Promise<unknown[]> =>
                client.post(`/api/schedule/packages/${packageId}/activities/day/${packageEventDayId}/reorder`, { activity_ids: activityIds }),
        },

        packageActivityMoments: {
            getAll: (activityId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/activities/${activityId}/moments`),
            create: (activityId: number, data: {
                name: string;
                order_index?: number;
                duration_seconds?: number;
                is_required?: boolean;
                notes?: string;
            }): Promise<unknown> =>
                client.post(`/api/schedule/packages/activities/${activityId}/moments`, data),
            bulkCreate: (activityId: number, moments: Array<{
                name: string;
                order_index?: number;
                duration_seconds?: number;
                is_required?: boolean;
                notes?: string;
            }>): Promise<unknown[]> =>
                client.post(`/api/schedule/packages/activities/${activityId}/moments/bulk`, { moments }),
            update: (momentId: number, data: {
                name?: string;
                order_index?: number;
                duration_seconds?: number;
                is_required?: boolean;
                notes?: string;
            }): Promise<unknown> =>
                client.patch(`/api/schedule/packages/activities/moments/${momentId}`, data),
            delete: (momentId: number): Promise<void> =>
                client.delete(`/api/schedule/packages/activities/moments/${momentId}`),
            reorder: (activityId: number, momentIds: number[]): Promise<unknown[]> =>
                client.post(`/api/schedule/packages/activities/${activityId}/moments/reorder`, { moment_ids: momentIds }),
        },

        packageEventDaySubjects: {
            getAll: (packageId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/${packageId}/subjects${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            create: (packageId: number, data: {
                event_day_template_id: number;
                name: string;
                count?: number;
                package_activity_id?: number;
                role_template_id?: number;
                category?: string;
                notes?: string;
                order_index?: number;
            }): Promise<unknown> =>
                client.post(`/api/schedule/packages/${packageId}/subjects`, data),
            update: (subjectId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/packages/subjects/${subjectId}`, data),
            delete: (subjectId: number): Promise<void> =>
                client.delete(`/api/schedule/packages/subjects/${subjectId}`),
            assignActivity: (subjectId: number, activityId: number): Promise<unknown> =>
                client.post(`/api/schedule/packages/subjects/${subjectId}/activities/${activityId}`, {}),
            unassignActivity: (subjectId: number, activityId: number): Promise<unknown> =>
                client.delete(`/api/schedule/packages/subjects/${subjectId}/activities/${activityId}`),
        },

        packageEventDayLocations: {
            getAll: (packageId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/${packageId}/locations${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            create: (packageId: number, data: {
                event_day_template_id: number;
                location_id: number;
                package_activity_id?: number;
                notes?: string;
                order_index?: number;
            }): Promise<unknown> =>
                client.post(`/api/schedule/packages/${packageId}/locations`, data),
            update: (locationId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/packages/locations/${locationId}`, data),
            delete: (locationId: number): Promise<void> =>
                client.delete(`/api/schedule/packages/locations/${locationId}`),
        },

        packageLocationSlots: {
            getAll: (packageId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/${packageId}/location-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            create: (packageId: number, data: {
                event_day_template_id: number;
                location_number?: number;
            }): Promise<unknown> =>
                client.post(`/api/schedule/packages/${packageId}/location-slots`, data),
            delete: (slotId: number): Promise<void> =>
                client.delete(`/api/schedule/packages/location-slots/${slotId}`),
            assignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.post(`/api/schedule/packages/location-slots/${slotId}/activities/${activityId}`, {}),
            unassignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.delete(`/api/schedule/packages/location-slots/${slotId}/activities/${activityId}`),
        },

        packageFilms: {
            getAll: (packageId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/packages/${packageId}/films`),
            create: (packageId: number, data: { film_id: number; order_index?: number; notes?: string }): Promise<unknown> =>
                client.post(`/api/schedule/packages/${packageId}/films`, data),
            update: (packageFilmId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/packages/films/${packageFilmId}`, data),
            delete: (packageFilmId: number): Promise<void> =>
                client.delete(`/api/schedule/packages/films/${packageFilmId}`),
            getSchedule: (packageFilmId: number): Promise<unknown> =>
                client.get(`/api/schedule/packages/films/${packageFilmId}/schedule`),
            upsertSceneSchedule: (packageFilmId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/packages/films/${packageFilmId}/scenes`, data),
            bulkUpsertSceneSchedules: (packageFilmId: number, schedules: unknown[]): Promise<unknown[]> =>
                client.post(`/api/schedule/packages/films/${packageFilmId}/scenes/bulk`, schedules),
        },

        packageSummary: {
            get: (packageId: number): Promise<unknown> =>
                client.get(`/api/schedule/packages/${packageId}/summary`),
        },
    };
}

export type SchedulePackageApi = ReturnType<typeof createSchedulePackageApi>;
