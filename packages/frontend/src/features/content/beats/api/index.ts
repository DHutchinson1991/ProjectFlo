import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  SceneBeat,
  CreateSceneBeatDto,
  UpdateSceneBeatDto,
} from '@/features/content/scenes/types/beats';

export const createBeatsApi = (client: ApiClient) => ({
  getSceneBeats: (sceneId: number): Promise<SceneBeat[]> =>
    client.get(`/api/beats/scenes/${sceneId}/beats`),

  create: (sceneId: number, data: CreateSceneBeatDto): Promise<SceneBeat> => {
    const payload = {
      name: data.name,
      duration_seconds: data.duration_seconds ?? 10,
      order_index: data.order_index ?? 0,
      shot_count: data.shot_count ?? null,
    };
    return client.post(`/api/beats/scenes/${sceneId}/beats`, payload);
  },

  update: (beatId: number, data: UpdateSceneBeatDto): Promise<SceneBeat> =>
    client.patch(`/api/beats/${beatId}`, data),

  delete: (beatId: number): Promise<void> =>
    client.delete(`/api/beats/${beatId}`),

  reorder: (sceneId: number, beatOrderings: Array<{ id: number; order_index: number }>): Promise<SceneBeat[]> =>
    client.post(`/api/beats/scenes/${sceneId}/reorder`, beatOrderings),

  recordingSetup: {
    get: (beatId: number): Promise<SceneBeat['recording_setup']> =>
      client.get(`/api/beats/${beatId}/recording-setup`),
    upsert: (beatId: number, data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean }): Promise<SceneBeat['recording_setup']> =>
      client.patch(`/api/beats/${beatId}/recording-setup`, data),
    delete: (beatId: number): Promise<void> =>
      client.delete(`/api/beats/${beatId}/recording-setup`),
  },
});

export const beatsApi = createBeatsApi(apiClient);
export type BeatsApi = ReturnType<typeof createBeatsApi>;
