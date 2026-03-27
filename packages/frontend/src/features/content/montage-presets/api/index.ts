import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  MontagePreset,
  CreateMontagePresetDto,
  UpdateMontagePresetDto,
} from '@/features/content/films/types/montage-presets';

export const createMontagePresetsApi = (client: ApiClient) => ({
  getAll: (brandId?: number): Promise<MontagePreset[]> => {
    const query = brandId ? `?brandId=${brandId}` : '';
    return client.get(`/api/montage-presets${query}`);
  },
  getById: (id: number): Promise<MontagePreset> =>
    client.get(`/api/montage-presets/${id}`),
  create: (data: CreateMontagePresetDto): Promise<MontagePreset> =>
    client.post('/api/montage-presets', data),
  update: (id: number, data: UpdateMontagePresetDto): Promise<MontagePreset> =>
    client.patch(`/api/montage-presets/${id}`, data),
  delete: (id: number): Promise<void> =>
    client.delete(`/api/montage-presets/${id}`),
});

export const montagePresetsApi = createMontagePresetsApi(apiClient);
export type MontagePresetsApi = ReturnType<typeof createMontagePresetsApi>;