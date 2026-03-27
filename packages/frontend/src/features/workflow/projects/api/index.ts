import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/project.types';

export const createProjectsApi = (client: ApiClient) => ({
  getAll: (_brandId?: number): Promise<Project[]> =>
    client.get('/api/projects'),

  getById: (id: number): Promise<Project> =>
    client.get(`/api/projects/${id}`),

  create: (data: CreateProjectRequest): Promise<Project> =>
    client.post('/api/projects', data),

  update: (id: number, data: UpdateProjectRequest): Promise<Project> =>
    client.put(`/api/projects/${id}`, data),

  delete: (id: number): Promise<void> =>
    client.delete(`/api/projects/${id}`),

  syncScheduleFromPackage: (id: number): Promise<void> =>
    client.post(`/api/projects/${id}/schedule/sync-from-package`, {}),

  getProjectEventDays: (id: number): Promise<any[]> =>
    client.get(`/api/schedule/projects/${id}/event-days`),

  getProjectFilms: (id: number): Promise<any[]> =>
    client.get(`/api/schedule/projects/${id}/films`),

  deleteProjectFilm: (projectFilmId: number): Promise<void> =>
    client.delete(`/api/schedule/projects/films/${projectFilmId}`),
});

export type ProjectsApi = ReturnType<typeof createProjectsApi>;

export const projectsApi = createProjectsApi(apiClient);
