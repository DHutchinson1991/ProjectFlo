import { apiClient } from '@/shared/api/client';
import type {
  GenerateBlockingRequest,
  GenerateBlockingResponse,
  GenerateSceneBlockingRequest,
  GenerateSceneBlockingResponse,
} from '../types';

export const blockingApi = {
  generateMoment: (data: GenerateBlockingRequest) =>
    apiClient.post<GenerateBlockingResponse>(
      '/api/ai/blocking/generate-moment',
      data,
      { skipBrandContext: true },
    ),

  generateScene: (data: GenerateSceneBlockingRequest) =>
    apiClient.post<GenerateSceneBlockingResponse>(
      '/api/ai/blocking/generate-scene',
      data,
      { skipBrandContext: true },
    ),
};
