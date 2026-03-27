import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  SceneAudioSource,
  CreateSceneAudioSourceDto,
  UpdateSceneAudioSourceDto,
} from '@/features/content/scenes/types/audio-sources';

export const createSceneAudioSourcesApi = (client: ApiClient) => ({
  getByScene: (sceneId: number): Promise<SceneAudioSource[]> =>
    client.get(`/api/scene-audio-sources/scenes/${sceneId}/audio-sources`),
  getById: (id: number): Promise<SceneAudioSource> =>
    client.get(`/api/scene-audio-sources/${id}`),
  create: (sceneId: number, data: CreateSceneAudioSourceDto): Promise<SceneAudioSource> =>
    client.post(`/api/scene-audio-sources/scenes/${sceneId}/audio-sources`, data),
  update: (id: number, data: UpdateSceneAudioSourceDto): Promise<SceneAudioSource> =>
    client.patch(`/api/scene-audio-sources/${id}`, data),
  delete: (id: number): Promise<void> =>
    client.delete(`/api/scene-audio-sources/${id}`),
  reorder: (sceneId: number, orderings: Array<{ id: number; order_index: number }>): Promise<SceneAudioSource[]> =>
    client.post(`/api/scene-audio-sources/scenes/${sceneId}/audio-sources/reorder`, orderings),
});

export const sceneAudioSourcesApi = createSceneAudioSourcesApi(apiClient);
export type SceneAudioSourcesApi = ReturnType<typeof createSceneAudioSourcesApi>;