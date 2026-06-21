import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockingApi } from '../api';
import type { GenerateSceneBlockingRequest } from '../types';

const BLOCKING_QUERY_KEYS = [
  'space-slots',
  'scene-spatial',
  'moment-subjects',
  'films',
  'scene-moments',
  'moments',
  'recording-setup',
  ['shot-previews', 'spatial-overlay'],
  ['shot-previews', 'composition-guide'],
] as const;

function invalidateBlockingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of BLOCKING_QUERY_KEYS) {
    if (Array.isArray(key)) {
      queryClient.invalidateQueries({ queryKey: key });
    } else {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }
}

export function useGenerateSceneBlocking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateSceneBlockingRequest) =>
      blockingApi.generateScene(data),
    onSuccess: () => {
      invalidateBlockingQueries(queryClient);
    },
  });
}
