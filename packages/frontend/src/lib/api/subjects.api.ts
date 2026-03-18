/**
 * Subjects API - Film subject management
 * Handles CRUD operations for film subjects and subject templates
 */

import type { FilmSubject, SubjectTemplate, CreateFilmSubjectDto, UpdateFilmSubjectDto } from '../types/domains/subjects';
import type { ApiClient } from './api-client.types';

export const createSubjectsApi = (client: ApiClient) => ({
  /**
   * Film Subjects - Subjects assigned to a specific film
   */
  subjects: {
    /**
     * Get all subjects for a film
     * GET /subjects?filmId=1
     */
    getByFilm: (filmId: number): Promise<FilmSubject[]> =>
      client.get(`/subjects?filmId=${filmId}`),

    /**
     * Get a single film subject
     * GET /subjects/:id
     */
    getById: (id: number): Promise<FilmSubject> =>
      client.get(`/subjects/${id}`),

    /**
     * Create a new film subject
     * POST /subjects
     */
    create: (data: CreateFilmSubjectDto): Promise<FilmSubject> =>
      client.post('/subjects', data),

    /**
     * Update a film subject
     * PATCH /subjects/:id
     */
    update: (id: number, data: UpdateFilmSubjectDto): Promise<FilmSubject> =>
      client.patch(`/subjects/${id}`, data),

    /**
     * Delete a film subject
     * DELETE /subjects/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/subjects/${id}`),
  },

  /**
   * Subject Templates - System templates for suggested subjects
   */
  templates: {
    /**
     * Get all subject templates (system defaults)
     * GET /subjects/templates
     */
    getAll: (): Promise<SubjectTemplate[]> =>
      client.get('/subjects/templates', { skipBrandContext: true }),

    /**
     * Get a single subject template
     * GET /subjects/templates/:id
     */
    getById: (id: number): Promise<SubjectTemplate> =>
      client.get(`/subjects/templates/${id}`, { skipBrandContext: true }),
  },
});

export type SubjectsApi = ReturnType<typeof createSubjectsApi>;
