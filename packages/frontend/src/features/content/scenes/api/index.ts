/**
 * Scenes API - Scene and moment management
 * Handles CRUD operations for scenes, templates, coverage, and moments within films
 */

import type { FilmScene, CreateFilmSceneDto, UpdateFilmSceneDto, ScenesLibrary } from '@/features/content/scenes/types';
import type { SceneMoment, CreateSceneMomentDto, UpdateSceneMomentDto } from '@/features/content/moments/types';
import type { SceneRecordingSetup, UpdateSceneRecordingSetupDto } from '@/lib/types/domains/recording-setup';
import type { ApiClient } from '@/lib/api/api-client.types';

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
      client.get(`/api/scenes/films/${filmId}/scenes`),

    /**
     * Get a single scene with all moments
     * GET /scenes/:id
     */
    getById: (id: number): Promise<FilmScene> =>
      client.get(`/api/scenes/${id}`),

    /**
     * Create a new scene in a film
     * POST /scenes/films/:filmId/scenes
     * Note: Expects data to have film_id set
     */
    create: (data: CreateFilmSceneDto): Promise<FilmScene> => {
      if (!data.film_id) {
        throw new Error('CreateFilmSceneDto must include film_id');
      }
      return client.post(`/api/scenes/films/${data.film_id}/scenes`, data);
    },

    /**
     * Update a scene
     * PATCH /scenes/:id
     */
    update: (id: number, data: UpdateFilmSceneDto): Promise<FilmScene> =>
      client.patch(`/api/scenes/${id}`, data),

    /**
     * Delete a scene
     * DELETE /scenes/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/api/scenes/${id}`),

    /**
     * Scene Recording Setup
     * GET /scenes/:id/recording-setup
     * PATCH /scenes/:id/recording-setup
     * DELETE /scenes/:id/recording-setup
     */
    recordingSetup: {
      get: (sceneId: number): Promise<SceneRecordingSetup | null> =>
        client.get(`/api/scenes/${sceneId}/recording-setup`),

      upsert: (sceneId: number, data: UpdateSceneRecordingSetupDto): Promise<SceneRecordingSetup> =>
        client.patch(`/api/scenes/${sceneId}/recording-setup`, data),

      delete: (sceneId: number): Promise<{ message: string }> =>
        client.delete(`/api/scenes/${sceneId}/recording-setup`),
    },
  },

  /**
   * Scene Templates - Reusable scene definitions
   */
  templates: {
    /** GET /scenes/templates */
    getAll: (): Promise<ScenesLibrary[]> =>
      client.get('/api/scenes/templates'),

    /** GET /scenes/template/:templateId/scenes */
    getScenesByTemplate: (templateId: number): Promise<ScenesLibrary[]> =>
      client.get(`/api/scenes/template/${templateId}/scenes`),

    /** POST /scenes/templates/from-scene */
    createFromScene: (sceneId: number, name?: string): Promise<ScenesLibrary> =>
      client.post('/api/scenes/templates/from-scene', { scene_id: sceneId, name }),

    /** DELETE /scenes/templates/:id */
    delete: (id: number): Promise<{ message: string }> =>
      client.delete(`/api/scenes/templates/${id}`),
  },

  /**
   * Scene Coverage - Link coverage items to scenes
   */
  coverage: {
    /** POST /scenes/:sceneId/coverage */
    add: (
      sceneId: number,
      coverageIds: number[],
      assignments?: { coverageId: number; assignment: string }[],
    ): Promise<{ success: boolean; message: string; scene_id: number; coverage_ids: number[] }> =>
      client.post(`/api/scenes/${sceneId}/coverage`, { coverageIds, assignments }),

    /** GET /scenes/:sceneId/coverage */
    get: (sceneId: number): Promise<{ scene_id: number; scene_name: string; coverage_items: unknown[] }> =>
      client.get(`/api/scenes/${sceneId}/coverage`),

    /** DELETE /scenes/:sceneId/coverage/:coverageId */
    remove: (sceneId: number, coverageId: number): Promise<{ success: boolean; message: string }> =>
      client.delete(`/api/scenes/${sceneId}/coverage/${coverageId}`),

    /** DELETE /scenes/:sceneId/coverage */
    removeAll: (sceneId: number): Promise<{ success: boolean; message: string; removed_count: number }> =>
      client.delete(`/api/scenes/${sceneId}/coverage`),
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
      client.get(`/api/moments/scenes/${sceneId}/moments`),

    /**
     * Get a single moment
     * GET /moments/:id
     */
    getById: (id: number): Promise<SceneMoment> =>
      client.get(`/api/moments/${id}`),

    /**
     * Create a new moment in a scene
     * POST /moments/scenes/:sceneId/moments
     */
    create: (data: CreateSceneMomentDto): Promise<SceneMoment> => {
      if (!data.film_scene_id) {
        throw new Error('CreateSceneMomentDto must include film_scene_id');
      }
      return client.post(`/api/moments/scenes/${data.film_scene_id}/moments`, data);
    },

    /**
     * Update a moment
     * PATCH /moments/:id
     */
    update: (id: number, data: UpdateSceneMomentDto): Promise<SceneMoment> =>
      client.patch(`/api/moments/${id}`, data),

    /**
     * Delete a moment
     * DELETE /moments/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/api/moments/${id}`),

    /**
     * Clear a moment recording setup (override)
     * DELETE /moments/:id/recording-setup
     */
    clearRecordingSetup: (id: number): Promise<{ message: string }> =>
      client.delete(`/api/moments/${id}/recording-setup`),

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
      client.patch(`/api/moments/${id}/recording-setup`, data),
  },
});

export type ScenesApi = ReturnType<typeof createScenesApi>;
