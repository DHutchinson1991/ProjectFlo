import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type { EventType } from '../types';
import type {
    CreateEventTypeData,
    CreatePackageFromWizardData,
    LinkEventDayData,
    LinkSubjectRoleData,
    UpdateEventTypeData,
} from '../types/api.types';

export function createEventTypesApi(client: ApiClient) {
    return {
        getAll: () => client.get<EventType[]>('/api/event-types'),
        getById: (id: number) => client.get<EventType>(`/api/event-types/${id}`),
        create: (data: CreateEventTypeData) => client.post<EventType>('/api/event-types', data),
        update: (id: number, data: UpdateEventTypeData) => client.patch<EventType>(`/api/event-types/${id}`, data),
        remove: (id: number) => client.delete<void>(`/api/event-types/${id}`),
        linkEventDay: (eventTypeId: number, data: LinkEventDayData) =>
            client.post<unknown>(`/api/event-types/${eventTypeId}/event-days`, data),
        unlinkEventDay: (eventTypeId: number, dayTemplateId: number) =>
            client.delete<void>(`/api/event-types/${eventTypeId}/event-days/${dayTemplateId}`),
        linkSubjectRole: (eventTypeId: number, data: LinkSubjectRoleData) =>
            client.post<unknown>(`/api/event-types/${eventTypeId}/subject-roles`, data),
        unlinkSubjectRole: (eventTypeId: number, subjectRoleId: number) =>
            client.delete<void>(`/api/event-types/${eventTypeId}/subject-roles/${subjectRoleId}`),
        createPackageFromWizard: (eventTypeId: number, data: CreatePackageFromWizardData) =>
            client.post<unknown>(`/api/event-types/${eventTypeId}/create-package`, data),
    };
}

export const eventTypesApi = createEventTypesApi(apiClient);

export type EventTypesApi = ReturnType<typeof createEventTypesApi>;