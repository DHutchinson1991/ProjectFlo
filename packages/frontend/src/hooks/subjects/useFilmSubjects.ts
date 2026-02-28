import { useCallback, useEffect, useState } from "react";
import type {
  CreateFilmSubjectDto,
  FilmSubject,
  SubjectTemplate,
  UpdateFilmSubjectDto,
} from "../../lib/types/domains/subjects";
import { request } from "../utils/api";

export const useFilmSubjects = (filmId?: number, brandId?: number) => {
  const [subjects, setSubjects] = useState<FilmSubject[]>([]);
  const [templates, setTemplates] = useState<SubjectTemplate[]>([]);
  const [typeTemplates, setTypeTemplates] = useState<any[]>([]); // New: Type templates with roles
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    if (!filmId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<FilmSubject[]>(`/subjects/films/${filmId}/subjects`);
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  }, [filmId]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await request<SubjectTemplate[]>("/subjects/templates/library", {}, { includeBrandQuery: false });
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subject templates");
    }
  }, []);

  // Load brand-specific type templates
  const loadTypeTemplates = useCallback(async () => {
    if (!brandId) return;
    try {
      const data = await request<any[]>(`/subjects/type-templates/brand/${brandId}`);
      setTypeTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load type templates");
    }
  }, [brandId]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    loadTypeTemplates();
  }, [loadTypeTemplates]);

  const createSubject = useCallback(async (payload: CreateFilmSubjectDto) => {
    const targetFilmId = payload.film_id ?? filmId;
    if (!targetFilmId) throw new Error("Film ID is required to create a subject.");

    const created = await request<FilmSubject>(`/subjects/films/${targetFilmId}/subjects`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setSubjects((prev) => [created, ...prev]);
    return created;
  }, [filmId]);

  const updateSubject = useCallback(async (id: number, payload: UpdateFilmSubjectDto) => {
    const updated = await request<FilmSubject>(`/subjects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setSubjects((prev) => prev.map((subject) => (subject.id === id ? updated : subject)));
    return updated;
  }, []);

  const deleteSubject = useCallback(async (id: number) => {
    await request<void>(`/subjects/${id}`, { method: "DELETE" });
    setSubjects((prev) => prev.filter((subject) => subject.id !== id));
  }, []);

  return {
    subjects,
    templates,
    typeTemplates,
    isLoading,
    error,
    reload: loadSubjects,
    loadTemplates,
    loadTypeTemplates,
    createSubject,
    updateSubject,
    deleteSubject,
  };
};
