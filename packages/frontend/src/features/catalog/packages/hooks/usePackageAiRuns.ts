'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { servicePackagesApi } from '../api';
import { catalogPackageKeys } from '../constants/query-keys';

interface QueryOptions {
    enabled?: boolean;
    live?: boolean;
    pollMs?: number;
}

export function usePackageAiRuns(packageId: number | null, options?: QueryOptions) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId && packageId
            ? catalogPackageKeys.packageAiRuns(brandId, packageId)
            : ['catalog', 'packages', 'ai-runs', 'missing-brand', packageId ?? 'none'],
        queryFn: () => servicePackagesApi.aiRuns.getAll(packageId as number),
        enabled: Boolean(brandId && packageId && (options?.enabled ?? true)),
        staleTime: 5_000,
        refetchInterval: options?.live ? (options.pollMs ?? 5_000) : false,
    });
}

export function usePackageAiRun(
    packageId: number | null,
    runId: string | null,
    options?: QueryOptions,
) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId && packageId && runId
            ? catalogPackageKeys.packageAiRunDetail(brandId, packageId, runId)
            : ['catalog', 'packages', 'ai-runs', 'detail', 'missing-brand', packageId ?? 'none', runId ?? 'none'],
        queryFn: () => servicePackagesApi.aiRuns.getById(packageId as number, runId as string),
        enabled: Boolean(brandId && packageId && runId && (options?.enabled ?? true)),
        staleTime: 5_000,
        refetchInterval: options?.live ? (options.pollMs ?? 5_000) : false,
    });
}

export function useCancelPackageAiRun(packageId: number | null) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (runId: string) => {
            if (packageId == null) {
                return Promise.reject(new Error('Package not loaded'));
            }
            return servicePackagesApi.aiRuns.cancel(packageId, runId);
        },
        onSuccess: (_data, runId) => {
            if (brandId && packageId) {
                qc.invalidateQueries({ queryKey: catalogPackageKeys.packageAiRuns(brandId, packageId) });
                qc.invalidateQueries({
                    queryKey: catalogPackageKeys.packageAiRunDetail(brandId, packageId, runId),
                });
                qc.invalidateQueries({
                    queryKey: catalogPackageKeys.servicePackageDetail(brandId, packageId),
                });
            }
        },
    });
}
