import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

import type { ServicePackage } from '../types/service-package.types';
import type { PackageSpaceSlot } from '@/features/workflow/locations/types/floor-plan.types';
import type {
    CreatePackageFromBuilderData,
    CreatePackageFromTemplateData,
    PackageAiRunDetail,
    PackageAiRunSummary,
    CreateServicePackageData,
    PackageBlueprintResyncPreview,
    PackageTraceabilityResponse,
    ServicePackagePriceEstimate,
    ServicePackageVersion,
    UpdateServicePackageData,
} from '../types/api.types';

export interface PackageBlueprintSpatialResponse {
    spaceSlots: PackageSpaceSlot[];
    placementSeed: {
        momentsSeeded: number;
        placementsWritten: number;
        skippedNoPosition: number;
    } | null;
}

export function createServicePackagesApi(client: ApiClient) {
    return {
        getAll: () => client.get<ServicePackage[]>('/api/packages'),
        getById: (id: number) => client.get<ServicePackage>(`/api/packages/${id}`),
        getTraceability: (id: number) =>
            client.get<PackageTraceabilityResponse>(`/api/packages/${id}/traceability`),
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
            cancel: (packageId: number, runId: string) =>
                client.post<{ runId: string; status: 'CANCEL_REQUESTED' | 'NOT_RUNNING' }>(
                    `/api/packages/${packageId}/ai-runs/${runId}/cancel`,
                    {},
                ),
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
        previewBlueprintResync: (packageId: number) =>
            client.get<PackageBlueprintResyncPreview>(
                `/api/packages/${packageId}/blueprint-resync-preview`,
            ),
        /** Re-materializes the latest published blueprint version into the package. */
        resyncBlueprint: (
            packageId: number,
            options?: { strategy?: 'structure_only' | 'placements_refresh'; seat_layout?: 'fluid' | 'distributed' },
        ) =>
            client.post<{
                already_current: boolean;
                package_id: number;
                new_blueprint_version_id?: number;
                placements_refreshed?: boolean;
            }>(
                `/api/packages/${packageId}/resync-blueprint`,
                {
                    strategy: options?.strategy ?? 'structure_only',
                    seat_layout: options?.seat_layout ?? 'fluid',
                },
            ),
        refreshBlueprintPlacements: (packageId: number) =>
            client.post<{
                already_current: boolean;
                package_id: number;
                placements_refreshed?: boolean;
            }>(
                `/api/packages/${packageId}/resync-blueprint`,
                { strategy: 'placements_refresh', seat_layout: 'fluid' },
            ),
        getBlueprintSpatial: (packageId: number) =>
            client.get<PackageBlueprintSpatialResponse>(`/api/packages/${packageId}/blueprint-spatial`),
    };
}

export const servicePackagesApi = createServicePackagesApi(apiClient);

export type ServicePackagesApi = ReturnType<typeof createServicePackagesApi>;