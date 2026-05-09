import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import type { CreateSubjectDto, UpdateSubjectDto } from '../types';
import { subjectsApi } from '../api/subjects.api';
import { rolesApi } from '../api/roles.api';

const subjectKeys = {
  byFilm: (filmId: number) => ['subjects-by-film', filmId] as const,
  templates: () => ['subject-templates'] as const,
  roles: (brandId: number) => ['subject-roles', brandId] as const,
};

export const useSubjects = (filmId?: number) => {
  const { currentBrand } = useBrand();
  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: subjectKeys.byFilm(filmId!),
    queryFn: () => subjectsApi.getSubjects(filmId!),
    enabled: !!filmId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: subjectKeys.templates(),
    queryFn: () => subjectsApi.getTemplates(),
  });

  const { data: typeTemplates = [] } = useQuery({
    queryKey: subjectKeys.roles(currentBrand?.id ?? 0),
    queryFn: () => rolesApi.getRoles(currentBrand?.id ?? 0),
    enabled: !!currentBrand?.id,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSubjectDto) => {
      if (!filmId) throw new Error('Film ID is required to create a subject.');
      return subjectsApi.createSubject(filmId, payload);
    },
    onSuccess: () => {
      if (filmId) queryClient.invalidateQueries({ queryKey: subjectKeys.byFilm(filmId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSubjectDto }) =>
      subjectsApi.updateSubject(id, payload),
    onSuccess: () => {
      if (filmId) queryClient.invalidateQueries({ queryKey: subjectKeys.byFilm(filmId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => subjectsApi.deleteSubject(id),
    onSuccess: () => {
      if (filmId) queryClient.invalidateQueries({ queryKey: subjectKeys.byFilm(filmId) });
    },
  });

  return {
    subjects,
    templates,
    typeTemplates,
    isLoading,
    error: error instanceof Error ? error.message : null,
    reload: () => filmId ? queryClient.invalidateQueries({ queryKey: subjectKeys.byFilm(filmId) }) : Promise.resolve(),
    loadTemplates: () => queryClient.invalidateQueries({ queryKey: subjectKeys.templates() }),
    loadTypeTemplates: () => currentBrand?.id
      ? queryClient.invalidateQueries({ queryKey: subjectKeys.roles(currentBrand.id) })
      : Promise.resolve(),
    createSubject: createMutation.mutateAsync,
    updateSubject: (id: number, payload: UpdateSubjectDto) => updateMutation.mutateAsync({ id, payload }),
    deleteSubject: deleteMutation.mutateAsync,
  };
};

export const useFilmSubjects = useSubjects;

