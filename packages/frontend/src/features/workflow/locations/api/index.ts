import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import { createLocationsApi } from './locations.api';
import { createFloorPlanApi } from './floor-plan.api';

export { createLocationsApi } from './locations.api';
export type { LocationsApi } from './locations.api';
export { createFloorPlanApi } from './floor-plan.api';
export type { FloorPlanApi } from './floor-plan.api';

export const locationsApi = createLocationsApi(apiClient as ApiClient);
export const floorPlanApi = createFloorPlanApi(apiClient as ApiClient);
