import { useCallback, useEffect, useState } from 'react';
import type { FilmStructureTemplate } from '../../lib/types/domains/film-structure-templates';
import type { FilmType } from '../../lib/types/domains/film';
import { request } from '../utils/api';

export const useFilmStructureTemplates = (brandId?: number, filmType?: FilmType) => {
  const [templates, setTemplates] = useState<FilmStructureTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (brandId) params.set('brandId', String(brandId));
      if (filmType) params.set('filmType', filmType);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await request<FilmStructureTemplate[]>(`/film-structure-templates${query}`);
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
