'use client';

import { useQuery } from '@tanstack/react-query';
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