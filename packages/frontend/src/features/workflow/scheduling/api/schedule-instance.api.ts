import type { ApiClient } from '@/shared/api/client';

// ─── Project + Inquiry Schedule CRUD API ─────────────────────────────────────

export function createScheduleInstanceApi(client: ApiClient) {
    return {
        projectEventDays: {
            getAll: (projectId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/event-days`),
            create: (projectId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/event-days`, data),
            update: (eventDayId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/projects/event-days/${eventDayId}`, data),
            delete: (eventDayId: number): Promise<void> =>
                client.delete(`/api/schedule/projects/event-days/${eventDayId}`),
        },

        projectActivities: {
            getByDay: (projectId: number, projectEventDayId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/activities/${projectEventDayId}`),
            create: (projectId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/activities`, data),
            update: (activityId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/projects/activities/${activityId}`, data),
            delete: (activityId: number): Promise<void> =>
                client.delete(`/api/schedule/projects/activities/${activityId}`),
        },

        projectFilms: {
            getAll: (projectId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/films`),
            create: (projectId: number, data: { film_id: number; package_film_id?: number; order_index?: number }): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/films`, data),
            delete: (projectFilmId: number): Promise<void> =>
                client.delete(`/api/schedule/projects/films/${projectFilmId}`),
            upsertSceneSchedule: (projectFilmId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/films/${projectFilmId}/scenes`, data),
            bulkUpsertSceneSchedules: (projectFilmId: number, schedules: unknown[]): Promise<unknown[]> =>
                client.post(`/api/schedule/projects/films/${projectFilmId}/scenes/bulk`, schedules),
            initializeFromPackage: (projectId: number, packageId: number): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/initialize-from-package/${packageId}`, {}),
        },

        inquiryEventDays: {
            getAll: (inquiryId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/inquiries/${inquiryId}/event-days`),
            create: (inquiryId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/inquiries/${inquiryId}/event-days`, data),
            update: (eventDayId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/inquiries/event-days/${eventDayId}`, data),
            delete: (eventDayId: number): Promise<void> =>
                client.delete(`/api/schedule/inquiries/event-days/${eventDayId}`),
        },

        inquiryActivities: {
            getAll: (inquiryId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/inquiries/${inquiryId}/activities`),
            getByDay: (inquiryId: number, eventDayId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/inquiries/${inquiryId}/activities/${eventDayId}`),
            create: (inquiryId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/inquiries/${inquiryId}/activities`, data),
            update: (activityId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/inquiries/activities/${activityId}`, data),
            delete: (activityId: number): Promise<void> =>
                client.delete(`/api/schedule/inquiries/activities/${activityId}`),
        },

        inquiryFilms: {
            getAll: (inquiryId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/inquiries/${inquiryId}/films`),
            create: (inquiryId: number, data: { film_id: number; package_film_id?: number; order_index?: number }): Promise<unknown> =>
                client.post(`/api/schedule/inquiries/${inquiryId}/films`, data),
            delete: (filmId: number): Promise<void> =>
                client.delete(`/api/schedule/projects/films/${filmId}`),
            upsertSceneSchedule: (filmId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/films/${filmId}/scenes`, data),
            bulkUpsertSceneSchedules: (filmId: number, schedules: unknown[]): Promise<unknown[]> =>
                client.post(`/api/schedule/projects/films/${filmId}/scenes/bulk`, schedules),
        },

        instanceMoments: {
            getByActivity: (activityId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/instance/activities/${activityId}/moments`),
            createForProject: (projectId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/activity-moments`, data),
            createForInquiry: (inquiryId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/inquiries/${inquiryId}/activity-moments`, data),
            update: (momentId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/instance/moments/${momentId}`, data),
            delete: (momentId: number): Promise<void> =>
                client.delete(`/api/schedule/instance/moments/${momentId}`),
            reorder: (activityId: number, momentIds: number[]): Promise<unknown[]> =>
                client.post(`/api/schedule/instance/activities/${activityId}/moments/reorder`, { moment_ids: momentIds }),
        },

        instanceSubjects: {
            getForProject: (projectId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/subjects${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            getForInquiry: (inquiryId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/inquiries/${inquiryId}/subjects${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            createForProject: (projectId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/subjects`, data),
            createForInquiry: (inquiryId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/inquiries/${inquiryId}/subjects`, data),
            update: (subjectId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/instance/subjects/${subjectId}`, data),
            delete: (subjectId: number): Promise<void> =>
                client.delete(`/api/schedule/instance/subjects/${subjectId}`),
            assignActivity: (subjectId: number, activityId: number): Promise<unknown> =>
                client.post(`/api/schedule/instance/subjects/${subjectId}/activities/${activityId}`, {}),
            unassignActivity: (subjectId: number, activityId: number): Promise<unknown> =>
                client.delete(`/api/schedule/instance/subjects/${subjectId}/activities/${activityId}`),
        },

        instanceLocationSlots: {
            getForProject: (projectId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/location-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            getForInquiry: (inquiryId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/inquiries/${inquiryId}/location-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            createForProject: (projectId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/location-slots`, data),
            createForInquiry: (inquiryId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/inquiries/${inquiryId}/location-slots`, data),
            update: (slotId: number, data: { name?: string | null; address?: string | null; notes?: string | null }): Promise<unknown> =>
                client.patch(`/api/schedule/instance/location-slots/${slotId}`, data),
            delete: (slotId: number): Promise<void> =>
                client.delete(`/api/schedule/instance/location-slots/${slotId}`),
            assignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.post(`/api/schedule/instance/location-slots/${slotId}/activities/${activityId}`, {}),
            unassignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.delete(`/api/schedule/instance/location-slots/${slotId}/activities/${activityId}`),
        },

        instanceCrewSlots: {
            getForProject: (projectId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/crew-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            getForInquiry: (inquiryId: number, eventDayId?: number): Promise<unknown[]> =>
                client.get(`/api/schedule/inquiries/${inquiryId}/crew-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
            createForProject: (projectId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/projects/${projectId}/crew-slots`, data),
            createForInquiry: (inquiryId: number, data: unknown): Promise<unknown> =>
                client.post(`/api/schedule/inquiries/${inquiryId}/crew-slots`, data),
            update: (slotId: number, data: unknown): Promise<unknown> =>
                client.patch(`/api/schedule/instance/crew-slots/${slotId}`, data),
            assignCrew: (slotId: number, crewMemberId: number | null): Promise<unknown> =>
                client.patch(`/api/schedule/instance/crew-slots/${slotId}/assign`, { crew_member_id: crewMemberId }),
            delete: (slotId: number): Promise<void> =>
                client.delete(`/api/schedule/instance/crew-slots/${slotId}`),
            setEquipment: (slotId: number, equipment: { equipment_id: number; is_primary: boolean }[]): Promise<unknown> =>
                client.post(`/api/schedule/instance/crew-slots/${slotId}/equipment`, { equipment }),
            assignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.post(`/api/schedule/instance/crew-slots/${slotId}/activities/${activityId}`, {}),
            unassignActivity: (slotId: number, activityId: number): Promise<unknown> =>
                client.delete(`/api/schedule/instance/crew-slots/${slotId}/activities/${activityId}`),
        },

        projectInstanceEventDays: {
            getAll: (projectId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/instance-event-days`),
        },

        projectAllActivities: {
            getAll: (projectId: number): Promise<unknown[]> =>
                client.get(`/api/schedule/projects/${projectId}/all-activities`),
        },

        getResolved: (filmId: number, params?: { packageFilmId?: number; projectFilmId?: number }): Promise<unknown> => {
            const query = new URLSearchParams();
            if (params?.packageFilmId) query.set('packageFilmId', String(params.packageFilmId));
            if (params?.projectFilmId) query.set('projectFilmId', String(params.projectFilmId));
            const qs = query.toString();
            return client.get(`/api/schedule/resolved/${filmId}${qs ? `?${qs}` : ''}`);
        },

        projectPackageSnapshot: {
            getSummary: (projectId: number): Promise<unknown> =>
                client.get(`/projects/${projectId}/package-snapshot`),
            getEventDays: (projectId: number): Promise<unknown[]> =>
                client.get(`/projects/${projectId}/package-snapshot/event-days`),
            getActivities: (projectId: number): Promise<unknown[]> =>
                client.get(`/projects/${projectId}/package-snapshot/activities`),
            getOperators: (projectId: number): Promise<unknown[]> =>
                client.get(`/projects/${projectId}/package-snapshot/operators`),
            getSubjects: (projectId: number): Promise<unknown[]> =>
                client.get(`/projects/${projectId}/package-snapshot/subjects`),
            getLocations: (projectId: number): Promise<unknown[]> =>
                client.get(`/projects/${projectId}/package-snapshot/locations`),
            getFilms: (projectId: number): Promise<unknown[]> =>
                client.get(`/projects/${projectId}/package-snapshot/films`),
            getActivityMoments: (projectId: number, activityId: number): Promise<unknown[]> =>
                client.get(`/projects/${projectId}/package-snapshot/activities/${activityId}/moments`),
        },

        syncFromPackage: {
            project: (projectId: number): Promise<unknown> =>
                client.post(`/projects/${projectId}/schedule/sync-from-package`, {}),
            inquiry: (inquiryId: number): Promise<unknown> =>
                client.post(`/api/inquiries/${inquiryId}/schedule/sync-from-package`, {}),
        },

        scheduleDiff: {
            project: (projectId: number): Promise<unknown> =>
                client.get(`/projects/${projectId}/schedule/diff`),
            inquiry: (inquiryId: number): Promise<unknown> =>
                client.get(`/api/inquiries/${inquiryId}/schedule/diff`),
        },
    };
}

export type ScheduleInstanceApi = ReturnType<typeof createScheduleInstanceApi>;
