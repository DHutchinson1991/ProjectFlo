import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { Brand, BrandMember } from '../types';

export function createBrandsApi(client: ApiClient) {
  return {
    getAll: () =>
      client.get<Brand[]>('/api/brands', { skipBrandContext: true }),

    getById: (id: number) =>
      client.get<Brand>(`/api/brands/${id}`, { skipBrandContext: true }),

    create: (data: Omit<Brand, 'id' | 'created_at' | 'updated_at'>) =>
      client.post<Brand>('/api/brands', data, { skipBrandContext: true }),

    update: (id: number, data: Partial<Brand>) =>
      client.patch<Brand>(`/api/brands/${id}`, data, { skipBrandContext: true }),

    delete: (id: number) =>
      client.delete<void>(`/api/brands/${id}`, { skipBrandContext: true }),

    getBrandMembers: (userId: number) =>
      client.get<BrandMember[]>(`/api/brands/users/${userId}/brands`, { skipBrandContext: true }),

    getBrandContext: (brandId: number, userId: number) =>
      client.get(`/api/brands/${brandId}/context/users/${userId}`, { skipBrandContext: true }),
  };
}

export const brandsApi = createBrandsApi(apiClient);
export type BrandsApi = ReturnType<typeof createBrandsApi>;
