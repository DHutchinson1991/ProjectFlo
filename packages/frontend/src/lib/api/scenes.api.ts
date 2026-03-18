/**
 * Scenes API - Scene and moment management
 * Handles CRUD operations for scenes and moments within films
 */

import type { FilmScene, CreateFilmSceneDto, UpdateFilmSceneDto } from '../types/domains/scenes';
import type { SceneMoment, CreateSceneMomentDto, UpdateSceneMomentDto } from '../types/domains/moments';
import type { SceneRecordingSetup, UpdateSceneRecordingSetupDto } from '../types/domains/recording-setup';
import type { ApiClient } from './api-client.types';

export const createScenesApi = (client: ApiClient) => ({
  /**
   * Film Scenes - Scenes within films (Moments or Montage)
   */
  scenes: {
    /**
     * Get all scenes for a film
     * GET /scenes/films/:filmId/scenes
     */
    getByFilm: (filmId: number): Promise<FilmScene[]> =>
      client.get(`/scenes/films/${filmId}/scenes`),

    /**
     * Get a single scene with all moments
     * GET /scenes/:id
     */
    getById: (id: number): Promise<FilmScene> =>
      client.get(`/scenes/${id}`),

    /**
     * Create a new scene in a film
     * POST /scenes/films/:filmId/scenes
     * Note: Expects data to have film_id set
     */
    create: (data: CreateFilmSceneDto): Promise<FilmScene> => {
      if (!data.film_id) {
        throw new Error('CreateFilmSceneDto must include film_id');
      }
      return client.post(`/scenes/films/${data.film_id}/scenes`, data);
    },

    /**
     * Update a scene
     * PATCH /scenes/:id
     */
    update: (id: number, data: UpdateFilmSceneDto): Promise<FilmScene> =>
      client.patch(`/scenes/${id}`, data),

    /**
     * Delete a scene
     * DELETE /scenes/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/scenes/${id}`),

    /**
     * Scene Recording Setup
     * GET /scenes/:id/recording-setup
     * PATCH /scenes/:id/recording-setup
     * DELETE /scenes/:id/recording-setup
     */
    recordingSetup: {
      get: (sceneId: number): Promise<SceneRecordingSetup | null> =>
        client.get(`/scenes/${sceneId}/recording-setup`),

      upsert: (sceneId: number, data: UpdateSceneRecordingSetupDto): Promise<SceneRecordingSetup> =>
        client.patch(`/scenes/${sceneId}/recording-setup`, data),

      delete: (sceneId: number): Promise<{ message: string }> =>
        client.delete(`/scenes/${sceneId}/recording-setup`),
    },
  },

  /**
   * Scene Moments - Individual moments within Moments scenes
   */
  moments: {
    /**
     * Get all moments for a scene
     * GET /moments/scenes/:sceneId/moments
     */
    getByScene: (sceneId: number): Promise<SceneMoment[]> =>
      client.get(`/moments/scenes/${sceneId}/moments`),

    /**
     * Get a single moment
     * GET /moments/:id
     */
    getById: (id: number): Promise<SceneMoment> =>
      client.get(`/moments/${id}`),

    /**
     * Create a new moment in a scene
     * POST /moments/scenes/:sceneId/moments
     */
    create: (data: CreateSceneMomentDto): Promise<SceneMoment> => {
      if (!data.film_scene_id) {
        throw new Error('CreateSceneMomentDto must include film_scene_id');
      }
      return client.post(`/moments/scenes/${data.film_scene_id}/moments`, data);
    },

    /**
     * Update a moment
     * PATCH /moments/:id
     */
    update: (id: number, data: UpdateSceneMomentDto): Promise<SceneMoment> =>
      client.patch(`/moments/${id}`, data),

    /**
     * Delete a moment
     * DELETE /moments/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/moments/${id}`),

    /**
     * Clear a moment recording setup (override)
     * DELETE /moments/:id/recording-setup
     */
    clearRecordingSetup: (id: number): Promise<{ message: string }> =>
      client.delete(`/moments/${id}/recording-setup`),

    /**
     * Upsert a moment recording setup (override)
     * PATCH /moments/:id/recording-setup
     */
    upsertRecordingSetup: (
      id: number,
      data: {
        camera_track_ids?: number[];
        camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>;
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
        graphics_title?: string | null;
      }
    ): Promise<{ id: number; audio_track_ids: number[]; graphics_enabled: boolean; graphics_title?: string | null; camera_assignments: Array<{ track_id: number; track_name?: string; track_type?: string; subject_ids?: number[]; shot_type?: string | null }> }> =>
      client.patch(`/moments/${id}/recording-setup`, data),
  },
});

export type ScenesApi = ReturnType<typeof createScenesApi>;
