import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { projectsApi } from '../api';
import { projectKeys } from './queryKeys';

/** Fetch a single project by ID with all related data. */
export function useProject(id: number) {
    const { currentBrandId } = useBrand();

    return useQuery({
        queryKey: projectKeys.detail(currentBrandId, id),
        queryFn: () => projectsApi.getById(id),
        enabled: !!currentBrandId && !!id,
        staleTime: 1000 * 60 * 5,
    });
}
