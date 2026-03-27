import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { packageSetsApi, servicePackagesApi } from '../api';
import { catalogPackageKeys } from '../constants/query-keys';
import type { CreatePackageSetData, UpdatePackageSetSlotData } from '../types';

interface QueryOptions {
    enabled?: boolean;
}

function useResolvedBrandId(brandIdOverride?: number) {
    const { currentBrand } = useBrand();
    return brandIdOverride ?? currentBrand?.id;
}

export function usePackageLibraryData(brandIdOverride?: number, options?: QueryOptions) {
    const brandId = useResolvedBrandId(brandIdOverride);

    return useQuery({
        queryKey: brandId ? catalogPackageKeys.library(brandId) : ['catalog', 'packages', 'library', 'missing-brand'],
        queryFn: async () => {
            const [packages, packageSets] = await Promise.all([
                servicePackagesApi.getAll(),
                packageSetsApi.getAll(),
            ]);

            return { packages, packageSets };
        },
        enabled: Boolean(brandId) && (options?.enabled ?? true),
        staleTime: 1000 * 60 * 5,
    });
}

function invalidatePackageQueries(queryClient: ReturnType<typeof useQueryClient>, brandId?: number) {
    if (!brandId) {
        return Promise.resolve();
    }

    return queryClient.invalidateQueries({ queryKey: catalogPackageKeys.all(brandId) });
}

export function useDeleteServicePackage(brandIdOverride?: number) {
    const brandId = useResolvedBrandId(brandIdOverride);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (packageId: number) => servicePackagesApi.delete(packageId),
        onSuccess: () => invalidatePackageQueries(queryClient, brandId),
    });
}

export function useCreatePackageSet(brandIdOverride?: number) {
    const brandId = useResolvedBrandId(brandIdOverride);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePackageSetData) => packageSetsApi.create(data),
        onSuccess: () => invalidatePackageQueries(queryClient, brandId),
    });
}

export function useAssignPackageSetSlot(brandIdOverride?: number) {
    const brandId = useResolvedBrandId(brandIdOverride);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ slotId, servicePackageId }: { slotId: number; servicePackageId: number }) =>
            packageSetsApi.assignPackage(slotId, servicePackageId),
        onSuccess: () => invalidatePackageQueries(queryClient, brandId),
    });
}

export function useClearPackageSetSlot(brandIdOverride?: number) {
    const brandId = useResolvedBrandId(brandIdOverride);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (slotId: number) => packageSetsApi.clearSlot(slotId),
        onSuccess: () => invalidatePackageQueries(queryClient, brandId),
    });
}

export function useAddPackageSetSlot(brandIdOverride?: number) {
    const brandId = useResolvedBrandId(brandIdOverride);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ setId, slotLabel }: { setId: number; slotLabel?: string }) =>
            packageSetsApi.addSlot(setId, slotLabel),
        onSuccess: () => invalidatePackageQueries(queryClient, brandId),
    });
}

export function useRemovePackageSetSlot(brandIdOverride?: number) {
    const brandId = useResolvedBrandId(brandIdOverride);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (slotId: number) => packageSetsApi.removeSlot(slotId),
        onSuccess: () => invalidatePackageQueries(queryClient, brandId),
    });
}

export function useUpdatePackageSetSlot(brandIdOverride?: number) {
    const brandId = useResolvedBrandId(brandIdOverride);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ slotId, data }: { slotId: number; data: UpdatePackageSetSlotData }) =>
            packageSetsApi.updateSlot(slotId, data),
        onSuccess: () => invalidatePackageQueries(queryClient, brandId),
    });
}