import { useCallback, useEffect, useState } from "react";
import type { CreateFilmDto, Film, UpdateFilmDto } from "../../lib/types/domains/film";
import { request } from "../utils/api";

export const useFilms = (brandId?: number) => {
  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = brandId ? `?brandId=${brandId}` : "";
      const data = await request<Film[]>(`/films${query}`);
      setFilms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load films");
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadFilms();
  }, [loadFilms]);

  const createFilm = useCallback(async (payload: CreateFilmDto) => {
    const created = await request<Film>("/films", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setFilms((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateFilm = useCallback(async (id: number, payload: UpdateFilmDto) => {
    const updated = await request<Film>(`/films/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setFilms((prev) => prev.map((film) => (film.id === id ? updated : film)));
    return updated;
  }, []);

  const deleteFilm = useCallback(async (id: number) => {
    await request<void>(`/films/${id}`, { method: "DELETE" });
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
