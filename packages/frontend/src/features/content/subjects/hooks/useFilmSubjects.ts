import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import type { CreateFilmSubjectDto, UpdateFilmSubjectDto } from '../types';
import { subjectsApi } from '../api/subjects.api';
import { rolesApi } from '../api/roles.api';

const filmSubjectsKeys = {
  byFilm: (filmId: number) => ['film-subjects', filmId] as const,
  templates: () => ['subject-templates'] as const,
  roles: (brandId: number) => ['subject-roles', brandId] as const,
};

export const useFilmSubjects = (filmId?: number) => {
  const { currentBrand } = useBrand();
  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: filmSubjectsKeys.byFilm(filmId!),
    queryFn: () => subjectsApi.getFilmSubjects(filmId!),
    enabled: !!filmId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: filmSubjectsKeys.templates(),
    queryFn: () => subjectsApi.getTemplates(),
  });

  const { data: typeTemplates = [] } = useQuery({
    queryKey: filmSubjectsKeys.roles(currentBrand?.id ?? 0),
    queryFn: () => rolesApi.getRoles(currentBrand?.id ?? 0),
    enabled: !!currentBrand?.id,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateFilmSubjectDto) => {
      const targetFilmId = payload.film_id ?? filmId;
      if (!targetFilmId) throw new Error('Film ID is required to create a subject.');
      return subjectsApi.createSubject(targetFilmId, payload);
    },
    onSuccess: () => {
      if (filmId) queryClient.invalidateQueries({ queryKey: filmSubjectsKeys.byFilm(filmId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateFilmSubjectDto }) =>
      subjectsApi.updateSubject(id, payload),
    onSuccess: () => {
      if (filmId) queryClient.invalidateQueries({ queryKey: filmSubjectsKeys.byFilm(filmId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => subjectsApi.deleteSubject(id),
    onSuccess: () => {
      if (filmId) queryClient.invalidateQueries({ queryKey: filmSubjectsKeys.byFilm(filmId) });
    },
  });

  return {
    subjects,
    templates,
    typeTemplates,
    isLoading,
    error: error instanceof Error ? error.message : null,
    reload: () => filmId ? queryClient.invalidateQueries({ queryKey: filmSubjectsKeys.byFilm(filmId) }) : Promise.resolve(),
    loadTemplates: () => queryClient.invalidateQueries({ queryKey: filmSubjectsKeys.templates() }),
    loadTypeTemplates: () => currentBrand?.id
      ? queryClient.invalidateQueries({ queryKey: filmSubjectsKeys.roles(currentBrand.id) })
      : Promise.resolve(),
    createSubject: createMutation.mutateAsync,
    updateSubject: (id: number, payload: UpdateFilmSubjectDto) => updateMutation.mutateAsync({ id, payload }),
    deleteSubject: deleteMutation.mutateAsync,
  };
};

