import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { Coverage, CreateCoverageDto, UpdateCoverageDto, CoverageType } from '../types';

export const createCoverageApi = (client: ApiClient) => ({
  getAll: (): Promise<Coverage[]> =>
    client.get('/api/coverage'),

  getById: (id: number): Promise<Coverage> =>
    client.get(`/api/coverage/${id}`),

  getByType: (type: CoverageType): Promise<Coverage[]> =>
    client.get(`/api/coverage?type=${type}`),

  create: (data: CreateCoverageDto): Promise<Coverage> =>
    client.post('/api/coverage', data, { skipBrandContext: true }),

  update: (id: number, data: UpdateCoverageDto): Promise<Coverage> =>
    client.patch(`/api/coverage/${id}`, data),

  delete: (id: number): Promise<void> =>
    client.delete(`/api/coverage/${id}`),
});

export const coverageApi = createCoverageApi(apiClient);
export type CoverageApi = ReturnType<typeof createCoverageApi>;
