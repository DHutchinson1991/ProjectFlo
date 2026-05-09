import { useQuery } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { packageTemplatesApi } from '../api';
import { packageTemplateKeys } from '../constants/query-keys';

interface UsePackageTemplatesOptions {
    enabled?: boolean;
}

export function usePackageTemplates(options?: UsePackageTemplatesOptions) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId ? packageTemplateKeys.list(brandId) : ['catalog', 'package-templates', 'missing-brand'],
        queryFn: () => packageTemplatesApi.getAll(),
        enabled: Boolean(brandId) && (options?.enabled ?? true),
        staleTime: 1000 * 60 * 5,
    });
}
