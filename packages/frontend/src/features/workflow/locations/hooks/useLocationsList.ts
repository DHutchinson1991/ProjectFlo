'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { locationsApi } from '../api';
import type { CreateLocationRequest, LocationsLibrary } from '../types';

export const locationKeys = {
    all: (brandId: number) => ['locations', brandId] as const,
};

export function useLocationsList() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    const locationsQuery = useQuery({
        queryKey: brandId ? locationKeys.all(brandId) : ['locations', 'missing-brand'],
        queryFn: () => locationsApi.getAll(),
        enabled: Boolean(brandId),
        staleTime: 1000 * 60 * 5,
    });

    const saveMutation = useMutation({
        mutationFn: ({ editingLocation, form }: { editingLocation: LocationsLibrary | null; form: CreateLocationRequest }) =>
            editingLocation
                ? locationsApi.update(editingLocation.id, form)
                : locationsApi.create({ ...form, ...(brandId ? { brand_id: brandId } : {}) }),
        onSuccess: () => {
            if (brandId) {
                queryClient.invalidateQueries({ queryKey: locationKeys.all(brandId) });
            }
        },
    });

    return {
        locations: locationsQuery.data ?? [],
        loading: locationsQuery.isPending,
        isError: locationsQuery.isError,
        saveMutation,
    };
}