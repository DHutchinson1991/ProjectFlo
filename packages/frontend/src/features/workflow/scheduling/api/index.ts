import { apiClient } from '@/shared/api/client';
import { createSchedulePresetsApi } from './schedule-presets.api';
import { createSchedulePackageApi } from './schedule-package.api';
import { createScheduleInstanceApi } from './schedule-instance.api';
import { createCrewSlotsApi } from './crew-slots.api';
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
export { createSchedulePresetsApi } from './schedule-presets.api';
export { createSchedulePackageApi } from './schedule-package.api';
export { createScheduleInstanceApi } from './schedule-instance.api';
export { createCrewSlotsApi } from './crew-slots.api';

export type { SchedulePresetsApi } from './schedule-presets.api';
export type { SchedulePackageApi } from './schedule-package.api';
export type { ScheduleInstanceApi } from './schedule-instance.api';
export type { CrewSlotsApi } from './crew-slots.api';

export type ScheduleApi = typeof scheduleApi;
