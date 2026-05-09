import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { projectsApi } from '../api';
import { projectKeys } from './queryKeys';

/** Fetch project event days. */
export function useProjectEventDays(projectId: number) {
    const { currentBrandId } = useBrand();

    return useQuery({
        queryKey: projectKeys.eventDays(currentBrandId, projectId),
        queryFn: () => projectsApi.getProjectEventDays(projectId),
        enabled: !!currentBrandId && !!projectId,
        staleTime: 1000 * 60 * 5,
    });
}

/** Fetch project films. */
export function useProjectFilms(projectId: number) {
    const { currentBrandId } = useBrand();

    return useQuery({
        queryKey: projectKeys.films(currentBrandId, projectId),
        queryFn: () => projectsApi.getProjectFilms(projectId),
        enabled: !!currentBrandId && !!projectId,
        staleTime: 1000 * 60 * 5,
    });
}

/** Sync project schedule from source package. */
export function useSyncScheduleFromPackage() {
    const { currentBrandId } = useBrand();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectId: number) => projectsApi.syncScheduleFromPackage(projectId),
        onSuccess: (_, projectId) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.schedule(currentBrandId, projectId) });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(currentBrandId, projectId) });
        },
    });
}

/** Delete a project film. */
export function useDeleteProjectFilm(projectId: number) {
    const { currentBrandId } = useBrand();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectFilmId: number) => projectsApi.deleteProjectFilm(projectFilmId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.films(currentBrandId, projectId) });
        },
    });
}
