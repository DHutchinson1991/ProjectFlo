import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type { ServicePackage } from '../types/service-package.types';
import type {
    CreatePackageFromBuilderData,
    CreatePackageFromTemplateData,
    PackageAiRunDetail,
    PackageAiRunSummary,
    CreateServicePackageData,
    ServicePackagePriceEstimate,
    ServicePackageVersion,
    UpdateServicePackageData,
} from '../types/api.types';

export function createServicePackagesApi(client: ApiClient) {
    return {
        getAll: () => client.get<ServicePackage[]>('/api/packages'),
        getById: (id: number) => client.get<ServicePackage>(`/api/packages/${id}`),
        create: (data: CreateServicePackageData) =>
            client.post<ServicePackage>('/api/packages', data),
        update: (id: number, data: UpdateServicePackageData) =>
            client.patch<ServicePackage>(`/api/packages/${id}`, data),
        delete: (id: number) => client.delete<void>(`/api/packages/${id}`),
        createFromBuilder: (data: CreatePackageFromBuilderData) =>
            client.post<ServicePackage>('/api/packages/from-builder', data),
        createFromTemplate: (eventTypeId: number, data: CreatePackageFromTemplateData) =>
            client.post<ServicePackage>(`/api/packages/from-template/${eventTypeId}`, data),
        estimatePrice: (brandId: number, packageId: number) =>
            client.get<ServicePackagePriceEstimate>(`/api/pricing/${brandId}/package/${packageId}`),
        estimateInquiryPrice: (brandId: number, inquiryId: number) =>
            client.get<ServicePackagePriceEstimate>(`/api/pricing/${brandId}/inquiry/${inquiryId}`),
        aiRuns: {
            getAll: (packageId: number) =>
                client.get<PackageAiRunSummary[]>(`/api/packages/${packageId}/ai-runs`),
            getById: (packageId: number, runId: string) =>
                client.get<PackageAiRunDetail>(`/api/packages/${packageId}/ai-runs/${runId}`),
        },
        versions: {
            getAll: (packageId: number) =>
                client.get<ServicePackageVersion[]>(`/api/packages/${packageId}/versions`),
            create: (packageId: number, changeSummary?: string) =>
                client.post<ServicePackageVersion>(`/api/packages/${packageId}/versions`, {
                    change_summary: changeSummary,
                }),
            getById: (packageId: number, versionId: number) =>
                client.get<ServicePackageVersion>(`/api/packages/${packageId}/versions/${versionId}`),
            restore: (packageId: number, versionId: number) =>
                client.post<ServicePackageVersion>(`/api/packages/${packageId}/versions/${versionId}/restore`, {}),
        },
        /** Re-materializes the latest published blueprint version into the package.
         *  Returns `{ already_current: true }` when no update is needed. */
        resyncBlueprint: (packageId: number) =>
            client.post<{ already_current: boolean; package_id: number; new_blueprint_version_id?: number }>(
                `/api/packages/${packageId}/resync-blueprint`,
                {},
            ),
    };
}

export const servicePackagesApi = createServicePackagesApi(apiClient);

export type ServicePackagesApi = ReturnType<typeof createServicePackagesApi>;