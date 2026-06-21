import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  EquipmentPreset,
  CreateEquipmentPresetData,
  UpdateEquipmentPresetData,
} from '../types/equipment-presets';

export function createEquipmentPresetsApi(client: ApiClient) {
  return {
    getAll: () => client.get<EquipmentPreset[]>('/api/equipment-presets'),
    getById: (id: number) => client.get<EquipmentPreset>(`/api/equipment-presets/${id}`),
    create: (data: CreateEquipmentPresetData) =>
      client.post<EquipmentPreset>('/api/equipment-presets', data),
    update: (id: number, data: UpdateEquipmentPresetData) =>
      client.patch<EquipmentPreset>(`/api/equipment-presets/${id}`, data),
    delete: (id: number) => client.delete<void>(`/api/equipment-presets/${id}`),
  };
}

export const equipmentPresetsApi = createEquipmentPresetsApi(apiClient);

export type EquipmentPresetsApi = ReturnType<typeof createEquipmentPresetsApi>;
