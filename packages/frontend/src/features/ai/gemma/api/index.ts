import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { GemmaChatRequest, GemmaChatResponse, GemmaModelsResponse } from '../types';

export function createGemmaApi(client: ApiClient) {
  return {
    chat: (data: GemmaChatRequest) =>
      client.post<GemmaChatResponse>('/api/ai/gemma/chat', data, {
        skipBrandContext: true,
      }),

    getModels: () =>
      client.get<GemmaModelsResponse>('/api/ai/gemma/models', {
        skipBrandContext: true,
      }),
  };
}

export const gemmaApi = createGemmaApi(apiClient);
export type GemmaApi = ReturnType<typeof createGemmaApi>;
