import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { CreateSceneMomentDto, SceneMoment, UpdateSceneMomentDto } from '../types';
import type { MomentRecordingSetup } from '../types/recording-setup';

type CreateMomentInput = Omit<CreateSceneMomentDto, 'film_scene_id'> & {
  source_activity_id?: number;
};

export const createMomentsApi = (client: ApiClient) => ({
  getSceneMoments: (sceneId: number): Promise<SceneMoment[]> =>
    client.get(`/api/moments/scenes/${sceneId}/moments`),

  getById: (id: number): Promise<SceneMoment> =>
    client.get(`/api/moments/${id}`),

  create: (sceneId: number, data: CreateMomentInput): Promise<SceneMoment> =>
    client.post(`/api/moments/scenes/${sceneId}/moments`, {
      name: data.name,
      duration: data.duration ?? 10,
      order_index: data.order_index ?? 0,
      source_activity_id: data.source_activity_id,
    }),

  update: (momentId: number, data: UpdateSceneMomentDto): Promise<SceneMoment> =>
    client.patch(`/api/moments/${momentId}`, data),

  delete: (momentId: number): Promise<void> =>
    client.delete(`/api/moments/${momentId}`),

  getRecordingSetup: (momentId: number): Promise<MomentRecordingSetup | null> =>
    client.get(`/api/moments/${momentId}/recording-setup`),
});

export type MomentsApi = ReturnType<typeof createMomentsApi>;

export const momentsApi = createMomentsApi(apiClient);
