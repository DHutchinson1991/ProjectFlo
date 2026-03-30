import { apiClient } from '@/shared/api/client';
import { createSchedulePresetsApi } from './presets';
import { createSchedulePackageApi } from './package-template';
import { createScheduleInstanceApi } from './instance';
import { createCrewSlotsApi } from './shared';
import type { ApiClient } from '@/shared/api/client';

export function createScheduleApi(client: ApiClient) {
    return {
        ...createSchedulePresetsApi(client),
        ...createSchedulePackageApi(client),
        ...createScheduleInstanceApi(client),
    };
}

export const scheduleApi = createScheduleApi(apiClient);

export const crewSlotsApi = createCrewSlotsApi(apiClient);

// Named re-exports for selective imports
export { createSchedulePresetsApi } from './presets';
export { createSchedulePackageApi } from './package-template';
export { createScheduleInstanceApi } from './instance';
export { createCrewSlotsApi } from './shared';

export type { SchedulePresetsApi } from './presets';
export type { SchedulePackageApi } from './package-template';
export type { ScheduleInstanceApi } from './instance';
export type { CrewSlotsApi } from './shared';

export type ScheduleApi = typeof scheduleApi;
