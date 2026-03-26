import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '../api';
import type { FilmLocationAssignment } from '../types';

export const filmLocationsKeys = {
    all: ['film-locations'] as const,
    byFilm: (filmId: number) => [...filmLocationsKeys.all, filmId] as const,
    allLocations: ['locations-library'] as const,
};

export const useFilmLocations = (filmId?: number) => {
    const queryClient = useQueryClient();

    const filmLocationsQuery = useQuery({
        queryKey: filmLocationsKeys.byFilm(filmId!),
        queryFn: () => locationsApi.filmLocations.getByFilm(filmId!),
        enabled: !!filmId,
    });

    const allLocationsQuery = useQuery({
        queryKey: filmLocationsKeys.allLocations,
        queryFn: () => locationsApi.getAll(),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: filmLocationsKeys.byFilm(filmId!) });

    const addMutation = useMutation({
        mutationFn: (locationId: number) =>
            locationsApi.filmLocations.addToFilm(filmId!, { location_id: locationId }),
        onSuccess: invalidate,
    });

    const removeMutation = useMutation({
        mutationFn: (locationId: number) =>
            locationsApi.filmLocations.removeFromFilm(filmId!, locationId),
        onSuccess: invalidate,
    });

    return {
        filmLocations: filmLocationsQuery.data ?? [] as FilmLocationAssignment[],
        allLocations: allLocationsQuery.data ?? [],
        isLoading: filmLocationsQuery.isLoading,
        error: filmLocationsQuery.error instanceof Error
            ? filmLocationsQuery.error.message
            : null,
        reload: invalidate,
        addLocation: (locationId: number) => addMutation.mutateAsync(locationId),
        removeLocation: (locationId: number) => removeMutation.mutateAsync(locationId),
    };
};
