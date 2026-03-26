import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import { createLocationsApi } from './locations.api';

export { createLocationsApi } from './locations.api';
export type { LocationsApi } from './locations.api';

export const locationsApi = createLocationsApi(apiClient as ApiClient);
