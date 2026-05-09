import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  CrewPreset,
  CreateCrewPresetData,
  UpdateCrewPresetData,
} from '../types/crew-presets';

export function createCrewPresetsApi(client: ApiClient) {
  return {
    getAll: () => client.get<CrewPreset[]>('/api/crew-presets'),
    getById: (id: number) => client.get<CrewPreset>(`/api/crew-presets/${id}`),
    create: (data: CreateCrewPresetData) =>
      client.post<CrewPreset>('/api/crew-presets', data),
    update: (id: number, data: UpdateCrewPresetData) =>
      client.patch<CrewPreset>(`/api/crew-presets/${id}`, data),
    delete: (id: number) => client.delete<void>(`/api/crew-presets/${id}`),
  };
}

export const crewPresetsApi = createCrewPresetsApi(apiClient);

export type CrewPresetsApi = ReturnType<typeof createCrewPresetsApi>;
