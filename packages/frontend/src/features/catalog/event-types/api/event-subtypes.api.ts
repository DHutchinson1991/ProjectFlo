import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type { EventSubtype } from '../types/api.types';

export function createEventSubtypesApi(client: ApiClient) {
    return {
        getAll: (brandId: number) => client.get<EventSubtype[]>(`/event-subtypes?brandId=${brandId}`),
        getById: (id: number, brandId: number) =>
            client.get<EventSubtype>(`/event-subtypes/${id}?brandId=${brandId}`),
        getSystemSeeded: () => client.get<EventSubtype[]>('/event-subtypes/system-seeded'),
        getBrandSpecific: (brandId: number) => client.get<EventSubtype[]>(`/event-subtypes/brand-specific?brandId=${brandId}`),
        createPackageFromTemplate: (
            eventSubtypeId: number,
            data: { packageName: string; packageDescription?: string },
            brandId: number,
        ) => client.post<unknown>(`/event-subtypes/${eventSubtypeId}/create-package?brandId=${brandId}`, data),
    };
}

export const eventSubtypesApi = createEventSubtypesApi(apiClient);

export type EventSubtypesApi = ReturnType<typeof createEventSubtypesApi>;