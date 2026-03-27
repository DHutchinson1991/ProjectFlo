import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type { ServicePackage } from '../types/service-package.types';
import type {
    CreatePackageFromBuilderData,
    CreateServicePackageData,
    ServicePackagePriceEstimate,
    ServicePackageVersion,
    UpdateServicePackageData,
} from '../types/api.types';

export function createServicePackagesApi(client: ApiClient) {
    return {
        getAll: () => client.get<ServicePackage[]>('/api/service-packages'),
        getById: (id: number) => client.get<ServicePackage>(`/api/service-packages/${id}`),
        create: (data: CreateServicePackageData) =>
            client.post<ServicePackage>('/api/service-packages', data),
        update: (id: number, data: UpdateServicePackageData) =>
            client.patch<ServicePackage>(`/api/service-packages/${id}`, data),
        delete: (id: number) => client.delete<void>(`/api/service-packages/${id}`),
        createFromBuilder: (data: CreatePackageFromBuilderData) =>
            client.post<ServicePackage>('/api/service-packages/from-builder', data),
        estimatePrice: (brandId: number, packageId: number) =>
            client.get<ServicePackagePriceEstimate>(`/api/pricing/${brandId}/package/${packageId}`),
        estimateInquiryPrice: (brandId: number, inquiryId: number) =>
            client.get<ServicePackagePriceEstimate>(`/api/pricing/${brandId}/inquiry/${inquiryId}`),
        versions: {
            getAll: (packageId: number) =>
                client.get<ServicePackageVersion[]>(`/api/service-packages/${packageId}/versions`),
            create: (packageId: number, changeSummary?: string) =>
                client.post<ServicePackageVersion>(`/api/service-packages/${packageId}/versions`, {
                    change_summary: changeSummary,
                }),
            getById: (packageId: number, versionId: number) =>
                client.get<ServicePackageVersion>(`/api/service-packages/${packageId}/versions/${versionId}`),
            restore: (packageId: number, versionId: number) =>
                client.post<ServicePackageVersion>(`/api/service-packages/${packageId}/versions/${versionId}/restore`, {}),
        },
    };
}

export const servicePackagesApi = createServicePackagesApi(apiClient);

export type ServicePackagesApi = ReturnType<typeof createServicePackagesApi>;