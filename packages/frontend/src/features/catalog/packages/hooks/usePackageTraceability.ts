'use client';

import { useQuery } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { servicePackagesApi } from '../api';
import { catalogPackageKeys } from '../constants/query-keys';

export function usePackageTraceability(packageId: number | null | undefined, options?: { enabled?: boolean }) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey:
            brandId && packageId
                ? catalogPackageKeys.packageTraceability(brandId, packageId)
                : (['catalog', 'packages', 'traceability', 'disabled'] as const),
        queryFn: () => servicePackagesApi.getTraceability(packageId as number),
        enabled: Boolean(brandId && packageId && (options?.enabled ?? true)),
        staleTime: 30_000,
    });
}
