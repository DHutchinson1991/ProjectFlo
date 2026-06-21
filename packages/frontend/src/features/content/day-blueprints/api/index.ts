import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  CreateDayBlueprintInput,
  DayBlueprintSummary,
  DayBlueprintVersionDetail,
  DayBlueprintVersionSummary,
} from '../types';

export const createDayBlueprintsApi = (client: ApiClient) => ({
  list: (options?: { includeSeeded?: boolean }): Promise<DayBlueprintSummary[]> =>
    client.get(`/api/day-blueprints${options?.includeSeeded ? '?include_seeded=1' : ''}`),

  getById: (id: number): Promise<DayBlueprintSummary> =>
    client.get(`/api/day-blueprints/${id}`),

  create: (data: CreateDayBlueprintInput): Promise<DayBlueprintSummary> =>
    client.post('/api/day-blueprints', data),

  update: (
    id: number,
    data: Partial<
      Pick<CreateDayBlueprintInput, 'display_name' | 'description' | 'event_category' | 'variant_tags' | 'is_active'>
    >,
  ): Promise<DayBlueprintSummary> =>
    client.patch(`/api/day-blueprints/${id}`, data),

  clone: (
    sourceBlueprintId: number,
    data?: { source_version_id?: number; key?: string; display_name?: string },
  ): Promise<DayBlueprintSummary> =>
    client.post(`/api/day-blueprints/${sourceBlueprintId}/clone`, data ?? {}),

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
