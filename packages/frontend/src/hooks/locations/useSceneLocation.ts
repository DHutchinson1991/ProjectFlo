import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { FilmSceneLocationAssignment } from "@/lib/types/locations";

export const useSceneLocation = (sceneId?: number | null) => {
  const [sceneLocation, setSceneLocation] = useState<FilmSceneLocationAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSceneLocation = useCallback(async () => {
    if (!sceneId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.filmLocations.getSceneLocation(sceneId);
      setSceneLocation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scene location");
    } finally {
      setIsLoading(false);
    }
  }, [sceneId]);

  useEffect(() => {
    loadSceneLocation();
  }, [loadSceneLocation]);

  const setLocation = useCallback(async (locationId: number) => {
    if (!sceneId) return;
    const updated = await apiClient.filmLocations.setSceneLocation(sceneId, { location_id: locationId });
    setSceneLocation(updated);
    return updated;
  }, [sceneId]);

  const clearLocation = useCallback(async () => {
    if (!sceneId) return;
    await apiClient.filmLocations.clearSceneLocation(sceneId);
    setSceneLocation(null);
  }, [sceneId]);

  return {
    sceneLocation,
    isLoading,
    error,
    reload: loadSceneLocation,
    setLocation,
    clearLocation,
  };
};
