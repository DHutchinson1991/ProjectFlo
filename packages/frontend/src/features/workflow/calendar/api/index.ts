import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
    BackendCalendarEvent,
    BackendTag,
    BackendCalendarStats,
    BackendCalendarTask,
    CalendarApiQuery,
    BackendContributor,
    CalendarEventUpsertRequest,
} from '../types/calendar-api.types';

// ——— Types ———
export type {
    BackendCalendarEvent,
    BackendTag,
    BackendCalendarStats,
    BackendCalendarTask,
    CalendarApiQuery,
    BackendContributor,
    CalendarEventUpsertRequest,
} from '../types/calendar-api.types';

// ——— Helpers ———

export function formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function buildQs(obj?: Record<string, string | number | undefined>): string {
    if (!obj) return '';
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => { if (v !== undefined) params.append(k, v.toString()); });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

// ——— Factory ———

export function createCalendarApi(client: ApiClient) {
    return {
        getEvents: (query?: CalendarApiQuery): Promise<BackendCalendarEvent[]> =>
            client.get(`/api/calendar/events${buildQs(query as Record<string, string | number | undefined>)}`),
        getEventById: (id: number): Promise<BackendCalendarEvent> =>
            client.get(`/api/calendar/events/${id}`),
        createEvent: (event: CalendarEventUpsertRequest): Promise<BackendCalendarEvent> =>
            client.post('/api/calendar/events', event),
        updateEvent: (id: number, event: CalendarEventUpsertRequest): Promise<BackendCalendarEvent> =>
            client.put(`/api/calendar/events/${id}`, event),
        deleteEvent: (id: number): Promise<void> =>
            client.delete(`/api/calendar/events/${id}`),
        getEventsForDateRange: (start: Date, end: Date, contributorId?: number): Promise<BackendCalendarEvent[]> => {
            const q: CalendarApiQuery = { start_date: formatDateForApi(start), end_date: formatDateForApi(end) };
            if (contributorId) q.contributor_id = contributorId;
            return client.get(`/api/calendar/events${buildQs(q as Record<string, string | number | undefined>)}`);
        },
        getTodaysEvents: (contributorId?: number): Promise<BackendCalendarEvent[]> =>
            client.get(`/api/calendar/events/today${contributorId ? `?contributor_id=${contributorId}` : ''}`),
        getUpcomingEvents: (contributorId?: number, limit?: number): Promise<BackendCalendarEvent[]> => {
            const q: Record<string, number | undefined> = {};
            if (contributorId) q.contributor_id = contributorId;
            if (limit) q.limit = limit;
            return client.get(`/api/calendar/events/upcoming${buildQs(q)}`);
        },
        getTags: (): Promise<BackendTag[]> => client.get('/api/calendar/tags'),
        createTag: (tag: Omit<BackendTag, 'id'>): Promise<BackendTag> =>
            client.post('/api/calendar/tags', tag),
        getCalendarStats: (userId?: number): Promise<BackendCalendarStats> =>
            client.get(`/api/calendar/stats${userId ? `?user_id=${userId}` : ''}`),
        getTasksForDateRange: (start: Date, end: Date): Promise<BackendCalendarTask[]> => {
            const params = new URLSearchParams({
                start_date: formatDateForApi(start),
                end_date: formatDateForApi(end),
            });
            return client.get(`/api/calendar/tasks?${params}`);
        },
        getContributors: (): Promise<BackendContributor[]> => client.get('/api/contributors'),
    };
}

export const calendarApi = createCalendarApi(apiClient as unknown as ApiClient);
export type CalendarApi = ReturnType<typeof createCalendarApi>;
