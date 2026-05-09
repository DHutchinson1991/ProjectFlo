'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { floorPlanApi } from '../api';
import type { SaveFloorPlanCanvasRequest } from '../types/floor-plan.types';

export const floorPlanKeys = {
    all: (brandId: string) => ['floor-plans', brandId] as const,
    byLocation: (brandId: string, locationId: number) =>
        [...floorPlanKeys.all(brandId), 'location', locationId] as const,
    detail: (brandId: string, locationId: number, id: number) =>
        [...floorPlanKeys.all(brandId), 'detail', locationId, id] as const,
};

export function useFloorPlans(locationId: number) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: floorPlanKeys.byLocation(brandId, locationId),
        queryFn: () => floorPlanApi.getByLocation(locationId),
        enabled: !!currentBrand?.id && !!locationId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useFloorPlan(locationId: number, floorPlanId: number) {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');

    return useQuery({
        queryKey: floorPlanKeys.detail(brandId, locationId, floorPlanId),
        queryFn: () => floorPlanApi.getById(locationId, floorPlanId),
        enabled: !!currentBrand?.id && !!locationId && !!floorPlanId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useCreateFloorPlan() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ locationId, name }: { locationId: number; name?: string }) =>
            floorPlanApi.create(locationId, name ? { name } : undefined),
        onSuccess: (_, { locationId }) => {
            queryClient.invalidateQueries({
                queryKey: floorPlanKeys.byLocation(brandId, locationId),
            });
        },
    });
}

export function useSaveFloorPlanCanvas() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            locationId,
            floorPlanId,
            data,
        }: {
            locationId: number;
            floorPlanId: number;
            data: SaveFloorPlanCanvasRequest;
        }) => floorPlanApi.saveCanvas(locationId, floorPlanId, data),
        onSuccess: (result, { locationId, floorPlanId }) => {
            queryClient.setQueryData(
                floorPlanKeys.detail(brandId, locationId, floorPlanId),
                result,
            );
            queryClient.invalidateQueries({
                queryKey: floorPlanKeys.byLocation(brandId, locationId),
            });
        },
    });
}

export function useDeleteFloorPlan() {
    const { currentBrand } = useBrand();
    const brandId = String(currentBrand?.id ?? '');
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ locationId, id }: { locationId: number; id: number }) =>
            floorPlanApi.delete(locationId, id),
        onSuccess: (_, { locationId }) => {
            queryClient.invalidateQueries({
                queryKey: floorPlanKeys.byLocation(brandId, locationId),
            });
        },
    });
}
