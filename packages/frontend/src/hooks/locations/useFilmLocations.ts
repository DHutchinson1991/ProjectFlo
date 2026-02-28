import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { FilmLocationAssignment, LocationsLibrary } from "@/lib/types/locations";

export const useFilmLocations = (filmId?: number, brandId?: number) => {
  const [filmLocations, setFilmLocations] = useState<FilmLocationAssignment[]>([]);
  const [allLocations, setAllLocations] = useState<LocationsLibrary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilmLocations = useCallback(async () => {
    if (!filmId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.filmLocations.getByFilm(filmId);
      setFilmLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load film locations");
    } finally {
      setIsLoading(false);
    }
  }, [filmId]);

  const loadAllLocations = useCallback(async () => {
    try {
      const data = await apiClient.locations.getAll(brandId);
      setAllLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations");
    }
  }, [brandId]);

  useEffect(() => {
    loadFilmLocations();
  }, [loadFilmLocations]);

  useEffect(() => {
    loadAllLocations();
  }, [loadAllLocations]);

  const addLocation = useCallback(async (locationId: number) => {
    if (!filmId) return;
    const created = await apiClient.filmLocations.addToFilm(filmId, { location_id: locationId });
    setFilmLocations((prev) => {
      if (prev.some((item) => item.location_id === created.location_id)) return prev;
      return [...prev, created];
    });
    return created;
  }, [filmId]);

  const removeLocation = useCallback(async (locationId: number) => {
    if (!filmId) return;
    await apiClient.filmLocations.removeFromFilm(filmId, locationId);
    setFilmLocations((prev) => prev.filter((item) => item.location_id !== locationId));
  }, [filmId]);

  return {
    filmLocations,
    allLocations,
    isLoading,
    error,
    reload: loadFilmLocations,
    addLocation,
    removeLocation,
  };
};
