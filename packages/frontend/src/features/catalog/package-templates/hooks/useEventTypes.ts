import { useQuery } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { packageTemplatesApi } from '../api';
import { packageTemplateKeys } from '../constants/query-keys';

interface UseEventTypesOptions {
    enabled?: boolean;
}

/**
 * Legacy-shape hook returning package templates adapted to the old EventType shape.
 * Prefer `usePackageTemplates` for new code.
 */
export function useEventTypes(options?: UseEventTypesOptions) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    const query = useQuery({
        queryKey: brandId
            ? [...packageTemplateKeys.list(brandId), 'as-event-types']
            : ['catalog', 'package-templates', 'missing-brand', 'as-event-types'],
        queryFn: () => packageTemplatesApi.getAllAsEventTypes(),
        enabled: Boolean(brandId) && (options?.enabled ?? true),
        staleTime: 1000 * 60 * 5,
        refetchOnMount: 'always',
    });

    return {
        eventTypes: query.data ?? [],
        data: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}
