import { useMutation, useQuery } from '@tanstack/react-query';
import { gemmaApi } from '../api';
import type { GemmaChatRequest } from '../types';

export function useGemmaChat() {
  return useMutation({
    mutationFn: (data: GemmaChatRequest) => gemmaApi.chat(data),
  });
}

export function useGemmaModels() {
  return useQuery({
    queryKey: ['ai', 'gemma', 'models'],
    queryFn: () => gemmaApi.getModels(),
    staleTime: 1000 * 60 * 30,
  });
}
