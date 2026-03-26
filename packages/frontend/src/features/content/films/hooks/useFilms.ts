import { useCallback, useEffect, useState } from "react";
import type { CreateFilmDto, Film, UpdateFilmDto } from "../types";
import { apiClient } from "@/lib/api";
import { createFilmsApi } from "../api";
import type { ApiClient } from "@/lib/api/api-client.types";

const filmsApi = createFilmsApi(apiClient as unknown as ApiClient);

export const useFilms = (brandId?: number) => {
  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await filmsApi.films.getAll();
      setFilms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load films");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFilms();
  }, [loadFilms]);

  const createFilm = useCallback(async (payload: CreateFilmDto) => {
    const created = await filmsApi.films.create(payload);
    setFilms((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateFilm = useCallback(async (id: number, payload: UpdateFilmDto) => {
    const updated = await filmsApi.films.update(id, payload);
    setFilms((prev) => prev.map((film) => (film.id === id ? updated : film)));
    return updated;
  }, []);

  const deleteFilm = useCallback(async (id: number) => {
    await filmsApi.films.delete(id);
    setFilms((prev) => prev.filter((film) => film.id !== id));
  }, []);

  return {
    films,
    isLoading,
    error,
    reload: loadFilms,
    createFilm,
    updateFilm,
    deleteFilm,
  };
};
