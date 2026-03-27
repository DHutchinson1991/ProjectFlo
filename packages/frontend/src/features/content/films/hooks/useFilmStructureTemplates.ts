import { useCallback, useEffect, useState } from 'react';
import type { FilmStructureTemplate } from '@/features/content/films/types/film-structure-templates';
import type { FilmType } from '@/features/content/films/types';
import { filmStructureTemplatesApi } from '@/features/content/film-structure-templates/api';

export const useFilmStructureTemplates = (brandId?: number, filmType?: FilmType) => {
  const [templates, setTemplates] = useState<FilmStructureTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await filmStructureTemplatesApi.getAll(brandId, filmType);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load film structure templates');
    } finally {
      setIsLoading(false);
    }
  }, [brandId, filmType]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return { templates, isLoading, error, reload: loadTemplates };
};
