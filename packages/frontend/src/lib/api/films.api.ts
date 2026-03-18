/**
 * Films API - Film management and timeline layers
 * Handles CRUD operations for films and timeline layer metadata
 */

import type { Film, CreateFilmDto, UpdateFilmDto, TimelineLayer, CreateTimelineLayerDto, UpdateTimelineLayerDto } from '../types/domains/film';
import type { ApiClient } from './api-client.types';

export const createFilmsApi = (client: ApiClient) => ({
  films: {
    /**
     * Get all films, optionally filtered by brand
     * GET /films?brandId=1
     */
    getAll: (brandId?: number): Promise<Film[]> => {
      const query = brandId ? `?brandId=${brandId}` : '';
      return client.get(`/films${query}`);
    },

    /**
     * Get a single film with all nested data (scenes, subjects, tracks)
     * GET /films/:id
     */
    getById: (id: number): Promise<Film> =>
      client.get(`/films/${id}`),

    /**
     * Create a new film
     * POST /films
     */
    create: (data: CreateFilmDto): Promise<Film> =>
      client.post('/films', data),

    /**
     * Update film basic information
     * PATCH /films/:id
     */
    update: (id: number, data: UpdateFilmDto): Promise<Film> =>
      client.patch(`/films/${id}`, data),

    /**
     * Delete a film
     * DELETE /films/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/films/${id}`),
  },

  /**
   * Timeline Layers - Track organization metadata
   * Manages layer types like "Video", "Audio", "Music", "Graphics"
   */
  timelineLayers: {
    /**
     * Get all active timeline layers
     * GET /films/timeline-layers
     */
    getAll: (): Promise<TimelineLayer[]> =>
      client.get('/films/timeline-layers', { skipBrandContext: true }),

    /**
     * Create a new timeline layer
     * POST /films/timeline-layers
     */
    create: (data: CreateTimelineLayerDto): Promise<TimelineLayer> =>
      client.post('/films/timeline-layers', data, { skipBrandContext: true }),

    /**
     * Update a timeline layer
     * PATCH /films/timeline-layers/:id
     */
    update: (id: number, data: UpdateTimelineLayerDto): Promise<TimelineLayer> =>
      client.patch(`/films/timeline-layers/${id}`, data, { skipBrandContext: true }),

    /**
     * Delete a timeline layer
     * DELETE /films/timeline-layers/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/films/timeline-layers/${id}`, { skipBrandContext: true }),
  },
});

export type FilmsApi = ReturnType<typeof createFilmsApi>;
