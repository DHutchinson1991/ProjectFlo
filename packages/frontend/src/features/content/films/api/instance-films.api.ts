import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

export function createInstanceFilmsApi(client: ApiClient) {
  return {
    cloneFromLibrary: (projectFilmId: number) =>
      client.post<{ cloned?: boolean }>(`/api/instance-films/${projectFilmId}/clone-from-library`, {}),
    scenes: {
      getAll: (projectFilmId: number) =>
        client.get<unknown[]>(`/api/instance-films/${projectFilmId}/scenes`),
      getById: (sceneId: number) =>
        client.get<unknown>(`/api/instance-films/scenes/${sceneId}`),
      create: (
        projectFilmId: number,
        data: {
          name: string;
          mode?: string;
          order_index?: number;
          duration_seconds?: number;
          source_scene_id?: number;
          scene_template_id?: number;
        },
      ) => client.post<unknown>(`/api/instance-films/${projectFilmId}/scenes`, data),
      update: (
        sceneId: number,
        data: { name?: string; order_index?: number; duration_seconds?: number },
      ) => client.patch<unknown>(`/api/instance-films/scenes/${sceneId}`, data),
      delete: (sceneId: number) =>
        client.delete<void>(`/api/instance-films/scenes/${sceneId}`),
      reorder: (projectFilmId: number, orderings: Array<{ id: number; order_index: number }>) =>
        client.post<unknown>(`/api/instance-films/${projectFilmId}/scenes/reorder`, orderings),
      recordingSetup: {
        get: (sceneId: number) =>
          client.get<unknown>(`/api/instance-films/scenes/${sceneId}/recording-setup`),
        upsert: (
          sceneId: number,
          data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean },
        ) => client.patch<unknown>(`/api/instance-films/scenes/${sceneId}/recording-setup`, data),
        delete: (sceneId: number) =>
          client.delete<unknown>(`/api/instance-films/scenes/${sceneId}/recording-setup`),
      },
    },
    moments: {
      getByScene: (sceneId: number) =>
        client.get<unknown[]>(`/api/instance-films/scenes/${sceneId}/moments`),
      getById: (momentId: number) =>
        client.get<unknown>(`/api/instance-films/moments/${momentId}`),
      create: (sceneId: number, data: { name: string; order_index?: number; duration?: number }) =>
        client.post<unknown>(`/api/instance-films/scenes/${sceneId}/moments`, data),
      update: (momentId: number, data: { name?: string; order_index?: number; duration?: number }) =>
        client.patch<unknown>(`/api/instance-films/moments/${momentId}`, data),
      delete: (momentId: number) =>
        client.delete<void>(`/api/instance-films/moments/${momentId}`),
      reorder: (sceneId: number, orderings: Array<{ id: number; order_index: number }>) =>
        client.post<unknown>(`/api/instance-films/scenes/${sceneId}/moments/reorder`, orderings),
      recordingSetup: {
        get: (momentId: number) =>
          client.get<unknown>(`/api/instance-films/moments/${momentId}/recording-setup`),
        upsert: (
          momentId: number,
          data: {
            camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>;
            audio_track_ids?: number[];
            graphics_enabled?: boolean;
            graphics_title?: string | null;
          },
        ) => client.patch<unknown>(`/api/instance-films/moments/${momentId}/recording-setup`, data),
        delete: (momentId: number) =>
          client.delete<unknown>(`/api/instance-films/moments/${momentId}/recording-setup`),
      },
    },
    beats: {
      getByScene: (sceneId: number) =>
        client.get<unknown[]>(`/api/instance-films/scenes/${sceneId}/beats`),
      getById: (beatId: number) =>
        client.get<unknown>(`/api/instance-films/beats/${beatId}`),
      create: (
        sceneId: number,
        data: { name: string; duration_seconds?: number; order_index?: number; shot_count?: number | null },
      ) => client.post<unknown>(`/api/instance-films/scenes/${sceneId}/beats`, data),
      update: (
        beatId: number,
        data: { name?: string; duration_seconds?: number; order_index?: number; shot_count?: number | null },
      ) => client.patch<unknown>(`/api/instance-films/beats/${beatId}`, data),
      delete: (beatId: number) =>
        client.delete<void>(`/api/instance-films/beats/${beatId}`),
      recordingSetup: {
        get: (beatId: number) =>
          client.get<unknown>(`/api/instance-films/beats/${beatId}/recording-setup`),
        upsert: (
          beatId: number,
          data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean },
        ) => client.patch<unknown>(`/api/instance-films/beats/${beatId}/recording-setup`, data),
        delete: (beatId: number) =>
          client.delete<unknown>(`/api/instance-films/beats/${beatId}/recording-setup`),
      },
    },
    tracks: {
      getAll: (projectFilmId: number, activeOnly?: boolean) => {
        const params = activeOnly ? '?activeOnly=true' : '';
        return client.get<unknown[]>(`/api/instance-films/${projectFilmId}/tracks${params}`);
      },
      create: (
        projectFilmId: number,
        data: { name: string; type: string; order_index?: number; is_active?: boolean },
      ) => client.post<unknown>(`/api/instance-films/${projectFilmId}/tracks`, data),
      update: (trackId: number, data: { name?: string; order_index?: number; is_active?: boolean }) =>
        client.patch<unknown>(`/api/instance-films/tracks/${trackId}`, data),
      delete: (trackId: number) =>
        client.delete<void>(`/api/instance-films/tracks/${trackId}`),
    },
    subjects: {
      getAll: (projectFilmId: number) =>
        client.get<unknown[]>(`/api/instance-films/${projectFilmId}/subjects`),
      create: (projectFilmId: number, data: { name: string; category?: string; priority?: string }) =>
        client.post<unknown>(`/api/instance-films/${projectFilmId}/subjects`, data),
      update: (subjectId: number, data: { name?: string; category?: string; priority?: string }) =>
        client.patch<unknown>(`/api/instance-films/subjects/${subjectId}`, data),
      delete: (subjectId: number) =>
        client.delete<void>(`/api/instance-films/subjects/${subjectId}`),
    },
    locations: {
      getAll: (projectFilmId: number) =>
        client.get<unknown[]>(`/api/instance-films/${projectFilmId}/locations`),
      create: (projectFilmId: number, data: { location_id: number; notes?: string }) =>
        client.post<unknown>(`/api/instance-films/${projectFilmId}/locations`, data),
      delete: (locationId: number) =>
        client.delete<void>(`/api/instance-films/locations/${locationId}`),
    },
    sceneSubjects: {
      getAll: (sceneId: number) =>
        client.get<unknown[]>(`/api/instance-films/scenes/${sceneId}/subjects`),
      add: (sceneId: number, data: { project_film_subject_id: number; priority?: number; notes?: string }) =>
        client.post<unknown>(`/api/instance-films/scenes/${sceneId}/subjects`, data),
      remove: (id: number) =>
        client.delete<void>(`/api/instance-films/scene-subjects/${id}`),
    },
    sceneLocation: {
      get: (sceneId: number) =>
        client.get<unknown>(`/api/instance-films/scenes/${sceneId}/location`),
      set: (sceneId: number, data: { location_id: number }) =>
        client.post<unknown>(`/api/instance-films/scenes/${sceneId}/location`, data),
      remove: (sceneId: number) =>
        client.delete<void>(`/api/instance-films/scenes/${sceneId}/location`),
    },
  };
}

export const instanceFilmsApi = createInstanceFilmsApi(apiClient);

export type InstanceFilmsApi = ReturnType<typeof createInstanceFilmsApi>;
