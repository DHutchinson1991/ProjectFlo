import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubjectPriority } from '../types';
import { subjectsApi } from '../api/subjects.api';

interface UseSceneSubjectsProps {
  sceneIds: number[];
}

const sceneSubjectsKeys = {
  byScene: (sceneId: number) => ['scene-subjects', sceneId] as const,
};

export const useSceneSubjects = ({ sceneIds }: UseSceneSubjectsProps) => {
  const queryClient = useQueryClient();
  const primarySceneId = useMemo(() => sceneIds.find((id) => typeof id === 'number') ?? null, [sceneIds]);

  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: sceneSubjectsKeys.byScene(primarySceneId!),
    queryFn: () => subjectsApi.getSceneSubjects(primarySceneId!),
    enabled: primarySceneId !== null,
  });

  const addMutation = useMutation({
    mutationFn: ({ subjectId, priority }: { subjectId: number; priority: SubjectPriority }) =>
      Promise.all(sceneIds.map((sceneId) => subjectsApi.assignToScene(sceneId, subjectId, priority))),
    onSuccess: () => {
      sceneIds.forEach((sceneId) =>
        queryClient.invalidateQueries({ queryKey: sceneSubjectsKeys.byScene(sceneId) }),
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (subjectId: number) =>
      Promise.all(sceneIds.map((sceneId) => subjectsApi.removeFromScene(sceneId, subjectId))),
    onSuccess: () => {
      sceneIds.forEach((sceneId) =>
        queryClient.invalidateQueries({ queryKey: sceneSubjectsKeys.byScene(sceneId) }),
      );
    },
  });

  return {
    subjects,
    isLoading,
    error: error instanceof Error ? error.message : null,
    reload: () => primarySceneId
      ? queryClient.invalidateQueries({ queryKey: sceneSubjectsKeys.byScene(primarySceneId) })
      : Promise.resolve(),
    addSubject: (subjectId: number, priority: SubjectPriority) =>
      addMutation.mutateAsync({ subjectId, priority }).then((results) => results[0]),
    removeSubject: (subjectId: number) => removeMutation.mutateAsync(subjectId),
  };
};

