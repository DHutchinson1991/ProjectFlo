import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockingApi } from '../api';
import type { GenerateBlockingRequest } from '../types';

export function useGenerateBlocking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateBlockingRequest) =>
      blockingApi.generateMoment(data),
    onSuccess: () => {
      // Invalidate space-slot and moment queries so the floorplan + action fields refresh
      queryClient.invalidateQueries({ queryKey: ['space-slots'] });
      queryClient.invalidateQueries({ queryKey: ['scene-spatial'] });
      queryClient.invalidateQueries({ queryKey: ['moment-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['films'] });
      queryClient.invalidateQueries({ queryKey: ['scene-moments'] });
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['recording-setup'] });
      queryClient.invalidateQueries({ queryKey: ['shot-previews', 'spatial-overlay'] });
      queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
    },
  });
}
