import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type {
    CreatePackageCategoryData,
    ServicePackageCategory,
    UpdatePackageCategoryData,
} from '../types/api.types';

export function createServicePackageCategoriesApi(client: ApiClient) {
    return {
        getAll: (_brandId: number) => client.get<ServicePackageCategory[]>(`/api/service-package-categories`),
        create: (_brandId: number, data: CreatePackageCategoryData) =>
            client.post<ServicePackageCategory>(`/api/service-package-categories`, data),
        update: (_brandId: number, id: number, data: UpdatePackageCategoryData) =>
            client.patch<ServicePackageCategory>(`/api/service-package-categories/${id}`, data),
        delete: (_brandId: number, id: number) => client.delete<void>(`/api/service-package-categories/${id}`),
    };
}

export const servicePackageCategoriesApi = createServicePackageCategoriesApi(apiClient);

export type ServicePackageCategoriesApi = ReturnType<typeof createServicePackageCategoriesApi>;