import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { locationsApi } from '../api';
import { locationKeys } from './useLocationsList';
import type { FilmLocationAssignment } from '../types';

export const filmLocationsKeys = {
    all: ['film-locations'] as const,
    byFilm: (filmId: number) => [...filmLocationsKeys.all, filmId] as const,
};

export const useFilmLocations = (filmId?: number) => {
    const queryClient = useQueryClient();
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    const filmLocationsQuery = useQuery({
        queryKey: filmLocationsKeys.byFilm(filmId!),
        queryFn: () => locationsApi.filmLocations.getByFilm(filmId!),
        enabled: !!filmId,
    });

    const allLocationsQuery = useQuery({
        queryKey: brandId ? locationKeys.all(brandId) : ['locations', 'missing-brand'],
        queryFn: () => locationsApi.getAll(),
        enabled: Boolean(brandId),
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
