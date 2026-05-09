import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { projectsApi } from '../api';
import { projectKeys } from './queryKeys';

/** Fetch the list of all projects for the current brand. */
export function useProjects() {
    const { currentBrandId } = useBrand();

    return useQuery({
        queryKey: projectKeys.lists(currentBrandId),
        queryFn: () => projectsApi.getAll(),
        enabled: !!currentBrandId,
        staleTime: 1000 * 60 * 5,
    });
}