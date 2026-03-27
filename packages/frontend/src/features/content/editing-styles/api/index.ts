import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  EditingStyleData,
  CreateEditingStyleData,
  UpdateEditingStyleData,
} from '@/features/content/films/types/media';

export const createEditingStylesApi = (client: ApiClient) => ({
  getAll: (): Promise<EditingStyleData[]> =>
    client.get('/editing-styles', { skipBrandContext: true }),
  getById: (id: number): Promise<EditingStyleData> =>
    client.get(`/editing-styles/${id}`, { skipBrandContext: true }),
  create: (data: CreateEditingStyleData): Promise<EditingStyleData> =>
    client.post('/editing-styles', data, { skipBrandContext: true }),
  update: (id: number, data: UpdateEditingStyleData): Promise<EditingStyleData> =>
    client.patch(`/editing-styles/${id}`, data, { skipBrandContext: true }),
  delete: (id: number): Promise<void> =>
    client.delete(`/editing-styles/${id}`, { skipBrandContext: true }),
});

export const editingStylesApi = createEditingStylesApi(apiClient);
export type EditingStylesApi = ReturnType<typeof createEditingStylesApi>;