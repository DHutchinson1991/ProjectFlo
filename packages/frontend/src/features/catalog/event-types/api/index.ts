import type { ApiClient } from '@/shared/api/client';
import {
    createEventSubtypesApi,
    eventSubtypesApi,
    type EventSubtypesApi,
} from './event-subtypes.api';
import {
    createEventTypesApi,
    eventTypesApi,
    type EventTypesApi,
} from './event-types.api';

export * from '../types/api.types';
export * from './event-subtypes.api';
export * from './event-types.api';

export function createCatalogEventTypesApi(client: ApiClient) {
    return {
        eventTypes: createEventTypesApi(client),
        eventSubtypes: createEventSubtypesApi(client),
    };
}

export const catalogEventTypesApi = {
    eventTypes: eventTypesApi,
    eventSubtypes: eventSubtypesApi,
};

export type CatalogEventTypesApi = typeof catalogEventTypesApi;
export type { EventSubtypesApi, EventTypesApi };
