import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  CreateDayBlueprintInput,
  DayBlueprintSummary,
  DayBlueprintVersionDetail,
  DayBlueprintVersionSummary,
} from '../types';

export const createDayBlueprintsApi = (client: ApiClient) => ({
  list: (): Promise<DayBlueprintSummary[]> =>
    client.get('/api/day-blueprints'),

  getById: (id: number): Promise<DayBlueprintSummary> =>
    client.get(`/api/day-blueprints/${id}`),

  create: (data: CreateDayBlueprintInput): Promise<DayBlueprintSummary> =>
    client.post('/api/day-blueprints', data),

  delete: (id: number): Promise<void> =>
    client.delete(`/api/day-blueprints/${id}`),

  versions: {
    list: (blueprintId: number): Promise<DayBlueprintVersionSummary[]> =>
      client.get(`/api/day-blueprints/${blueprintId}/versions`),

    getById: (blueprintId: number, versionId: number): Promise<DayBlueprintVersionDetail> =>
      client.get(`/api/day-blueprints/${blueprintId}/versions/${versionId}`),

    publish: (blueprintId: number, versionId: number): Promise<DayBlueprintVersionSummary> =>
      client.post(`/api/day-blueprints/${blueprintId}/versions/${versionId}/publish`, {}),

    archive: (blueprintId: number, versionId: number): Promise<DayBlueprintVersionSummary> =>
      client.post(`/api/day-blueprints/${blueprintId}/versions/${versionId}/archive`, {}),
  },
});

export const dayBlueprintsApi = createDayBlueprintsApi(apiClient);
export type DayBlueprintsApi = ReturnType<typeof createDayBlueprintsApi>;

export * from './ai';
export * from './authoring';
export * from './simulator';
