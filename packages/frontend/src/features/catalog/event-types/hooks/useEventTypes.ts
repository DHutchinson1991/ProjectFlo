import { useQuery } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { eventTypesApi } from '../api';
import { catalogEventTypeKeys } from '../constants/query-keys';

interface UseEventTypesOptions {
    enabled?: boolean;
}

export function useEventTypes(options?: UseEventTypesOptions) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId ? catalogEventTypeKeys.list(brandId) : ['catalog', 'event-types', 'missing-brand'],
        queryFn: () => eventTypesApi.getAll(),
        enabled: Boolean(brandId) && (options?.enabled ?? true),
        staleTime: 1000 * 60 * 5,
    });
}