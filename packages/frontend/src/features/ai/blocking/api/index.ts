import { apiClient } from '@/shared/api/client';
import type { GenerateBlockingRequest, GenerateBlockingResponse } from '../types';

export const blockingApi = {
  generateMoment: (data: GenerateBlockingRequest) =>
    apiClient.post<GenerateBlockingResponse>(
      '/api/ai/blocking/generate-moment',
      data,
      { skipBrandContext: true },
    ),
};
