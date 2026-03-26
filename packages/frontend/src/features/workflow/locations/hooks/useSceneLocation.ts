import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '../api';
import type { FilmSceneLocationAssignment } from '../types';

export const sceneLocationKeys = {
    all: ['scene-location'] as const,
    byScene: (sceneId: number) => [...sceneLocationKeys.all, sceneId] as const,
};

export const useSceneLocation = (sceneId?: number | null) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: sceneLocationKeys.byScene(sceneId!),
        queryFn: () => locationsApi.filmLocations.getSceneLocation(sceneId!),
        enabled: !!sceneId,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: sceneLocationKeys.byScene(sceneId!) });

    const setMutation = useMutation({
        mutationFn: (locationId: number) =>
            locationsApi.filmLocations.setSceneLocation(sceneId!, { location_id: locationId }),
        onSuccess: invalidate,
    });

    const clearMutation = useMutation({
        mutationFn: () => locationsApi.filmLocations.clearSceneLocation(sceneId!),
        onSuccess: invalidate,
    });

    return {
        sceneLocation: (query.data ?? null) as FilmSceneLocationAssignment | null,
        isLoading: query.isLoading,
        error: query.error instanceof Error ? query.error.message : null,
        reload: invalidate,
        setLocation: (locationId: number) => setMutation.mutateAsync(locationId),
        clearLocation: () => clearMutation.mutateAsync(),
    };
};
