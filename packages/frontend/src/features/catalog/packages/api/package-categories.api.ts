import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type {
    CreatePackageCategoryData,
    ServicePackageCategory,
    UpdatePackageCategoryData,
} from '../types/api.types';

export function createServicePackageCategoriesApi(client: ApiClient) {
    return {
        getAll: (brandId: number) => client.get<ServicePackageCategory[]>(`/brands/${brandId}/package-categories`),
        create: (brandId: number, data: CreatePackageCategoryData) =>
            client.post<ServicePackageCategory>(`/brands/${brandId}/package-categories`, data),
        update: (brandId: number, id: number, data: UpdatePackageCategoryData) =>
            client.patch<ServicePackageCategory>(`/brands/${brandId}/package-categories/${id}`, data),
        delete: (brandId: number, id: number) => client.delete<void>(`/brands/${brandId}/package-categories/${id}`),
    };
}

export const servicePackageCategoriesApi = createServicePackageCategoriesApi(apiClient);

export type ServicePackageCategoriesApi = ReturnType<typeof createServicePackageCategoriesApi>;