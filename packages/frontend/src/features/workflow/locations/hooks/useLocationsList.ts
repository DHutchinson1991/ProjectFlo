'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { locationsApi } from '../api';
import type { CreateLocationRequest, LocationCapacityFilter, LocationsLibrary } from '../types';

export interface LocationsListFilters {
    searchQuery: string;
    cityFilter: string;
    capacityFilter: LocationCapacityFilter;
}

export const locationKeys = {
    all: (brandId: number, filters?: LocationsListFilters) => [
        'locations',
        brandId,
        filters?.searchQuery ?? '',
        filters?.cityFilter ?? 'all',
        filters?.capacityFilter ?? 'all',
    ] as const,
};

export function useLocationsList(filters?: LocationsListFilters) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    const params = {
        search: filters?.searchQuery.trim() || undefined,
        city: filters?.cityFilter && filters.cityFilter !== 'all' ? filters.cityFilter : undefined,
        capacity:
            filters?.capacityFilter && filters.capacityFilter !== 'all'
                ? filters.capacityFilter
                : undefined,
    };

    const locationsQuery = useQuery({
        queryKey: brandId ? locationKeys.all(brandId, filters) : ['locations', 'missing-brand'],
        queryFn: () => locationsApi.getAll(params),
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
                queryClient.invalidateQueries({ queryKey: ['locations', brandId] });
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