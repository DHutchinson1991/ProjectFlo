import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type { PackageSet } from '../types/package-set.types';
import type {
    CreatePackageSetData,
    UpdatePackageSetData,
    UpdatePackageSetSlotData,
} from '../types/api.types';

export function createPackageSetsApi(client: ApiClient) {
    return {
        getAll: () => client.get<PackageSet[]>('/api/package-sets'),
        getById: (id: number) => client.get<PackageSet>(`/api/package-sets/${id}`),
        create: (data: CreatePackageSetData) => client.post<PackageSet>('/api/package-sets', data),
        update: (id: number, data: UpdatePackageSetData) =>
            client.patch<PackageSet>(`/api/package-sets/${id}`, data),
        delete: (id: number) => client.delete<void>(`/api/package-sets/${id}`),
        addSlot: (setId: number, slotLabel?: string) =>
            client.post<PackageSet>(`/api/package-sets/${setId}/slots`, { slot_label: slotLabel }),
        updateSlot: (slotId: number, data: UpdatePackageSetSlotData) =>
            client.patch<PackageSet>(`/api/package-sets/slots/${slotId}`, data),
        assignPackage: (slotId: number, servicePackageId: number) =>
            client.patch<PackageSet>(`/api/package-sets/slots/${slotId}/assign`, {
                service_package_id: servicePackageId,
            }),
        clearSlot: (slotId: number) =>
            client.patch<PackageSet>(`/api/package-sets/slots/${slotId}/clear`, {}),
        removeSlot: (slotId: number) => client.delete<void>(`/api/package-sets/slots/${slotId}`),
        reorderSlots: (setId: number, slotIds: number[]) =>
            client.patch<PackageSet>(`/api/package-sets/${setId}/reorder-slots`, { slot_ids: slotIds }),
        migratePackagesCategory: (setId: number, categoryId: number) =>
            client.patch<{ updated: number }>(`/api/package-sets/${setId}/migrate-categories`, { category_id: categoryId }),
        clearAllSlotAssignments: (setId: number) =>
            client.patch<{ cleared: number }>(`/api/package-sets/${setId}/clear-assignments`, {}),
    };
}

export const packageSetsApi = createPackageSetsApi(apiClient);

export type PackageSetsApi = ReturnType<typeof createPackageSetsApi>;