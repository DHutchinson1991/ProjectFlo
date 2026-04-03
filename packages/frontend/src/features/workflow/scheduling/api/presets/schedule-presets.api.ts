import type { ApiClient } from '@/shared/api/client';

// ─── Schedule Presets (brand-level) ──────────────────────────────────────────

export function createSchedulePresetsApi(client: ApiClient) {
    return {
        presets: {
            getAll: (brandId: number): Promise<any[]> =>
                client.get(`/api/schedule/presets/brand/${brandId}`),
            upsert: (brandId: number, data: { name: string; schedule_data: unknown[] }): Promise<any> =>
                client.post(`/api/schedule/presets/brand/${brandId}`, data),
            rename: (brandId: number, presetId: number, name: string): Promise<any> =>
                client.patch(`/api/schedule/presets/${presetId}/brand/${brandId}/rename`, { name }),
            delete: (brandId: number, presetId: number): Promise<void> =>
                client.delete(`/api/schedule/presets/${presetId}/brand/${brandId}`),
        },

        eventDays: {
            getAll: (brandId: number): Promise<any[]> =>
                client.get(`/api/schedule/event-days/brand/${brandId}`),
            create: (brandId: number, data: { name: string; description?: string; order_index?: number }): Promise<any> =>
                client.post(`/api/schedule/event-days/brand/${brandId}`, data),
            update: (brandId: number, id: number, data: unknown): Promise<any> =>
                client.patch(`/api/schedule/event-days/${id}/brand/${brandId}`, data),
            delete: (brandId: number, id: number): Promise<void> =>
                client.delete(`/api/schedule/event-days/${id}/brand/${brandId}`),
        },

        activityPresets: {
            getAll: (eventDayId: number): Promise<any[]> =>
                client.get(`/api/schedule/event-days/${eventDayId}/activity-presets`),
            create: (eventDayId: number, data: { name: string; color?: string; icon?: string; default_duration_minutes?: number; order_index?: number }): Promise<any> =>
                client.post(`/api/schedule/event-days/${eventDayId}/activity-presets`, data),
            bulkCreate: (eventDayId: number, presets: { name: string; color?: string; order_index?: number }[]): Promise<any> =>
                client.post(`/api/schedule/event-days/${eventDayId}/activity-presets/bulk`, { presets }),
            update: (presetId: number, data: unknown): Promise<any> =>
                client.patch(`/api/schedule/activity-presets/${presetId}`, data),
            delete: (presetId: number): Promise<void> =>
                client.delete(`/api/schedule/activity-presets/${presetId}`),
        },

        presetMoments: {
            getAll: (presetId: number): Promise<any[]> =>
                client.get(`/api/schedule/activity-presets/${presetId}/moments`),
            create: (presetId: number, data: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }): Promise<any> =>
                client.post(`/api/schedule/activity-presets/${presetId}/moments`, data),
            bulkCreate: (presetId: number, moments: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }[]): Promise<any> =>
                client.post(`/api/schedule/activity-presets/${presetId}/moments/bulk`, { moments }),
            update: (momentId: number, data: unknown): Promise<any> =>
                client.patch(`/api/schedule/preset-moments/${momentId}`, data),
            delete: (momentId: number): Promise<void> =>
                client.delete(`/api/schedule/preset-moments/${momentId}`),
        },

        film: {
            get: (filmId: number): Promise<any> =>
                client.get(`/api/schedule/films/${filmId}`),
            upsertScene: (filmId: number, data: unknown): Promise<any> =>
                client.post(`/api/schedule/films/${filmId}/scenes`, data),
            bulkUpsertScenes: (filmId: number, schedules: unknown[]): Promise<any[]> =>
                client.post(`/api/schedule/films/${filmId}/scenes/bulk`, schedules),
            updateScene: (scheduleId: number, data: unknown): Promise<any> =>
                client.patch(`/api/schedule/films/scenes/${scheduleId}`, data),
            deleteScene: (scheduleId: number): Promise<void> =>
                client.delete(`/api/schedule/films/scenes/${scheduleId}`),
        },
    };
}

export type SchedulePresetsApi = ReturnType<typeof createSchedulePresetsApi>;
