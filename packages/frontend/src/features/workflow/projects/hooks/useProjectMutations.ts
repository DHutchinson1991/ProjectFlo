import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { projectsApi } from '../api';
import { projectKeys } from './queryKeys';
import type { UpdateProjectRequest } from '../types/project.types';

/** Update a project's fields. */
export function useUpdateProject() {
    const { currentBrandId } = useBrand();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateProjectRequest }) =>
            projectsApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(currentBrandId, id) });
            queryClient.invalidateQueries({ queryKey: projectKeys.lists(currentBrandId) });
        },
    });
}

/** Delete (archive) a project. */
export function useDeleteProject() {
    const { currentBrandId } = useBrand();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => projectsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists(currentBrandId) });
        },
    });
}
