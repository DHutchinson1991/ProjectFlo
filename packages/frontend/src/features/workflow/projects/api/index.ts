import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { Project, ProjectListItem, UpdateProjectRequest } from '../types/project.types';

export const createProjectsApi = (client: ApiClient) => ({
  getAll: (): Promise<ProjectListItem[]> =>
    client.get('/api/projects'),

  getById: (id: number): Promise<Project> =>
    client.get(`/api/projects/${id}`),

  update: (id: number, data: UpdateProjectRequest): Promise<Project> =>
    client.put(`/api/projects/${id}`, data),

  delete: (id: number): Promise<void> =>
    client.delete(`/api/projects/${id}`),

  revertToInquiry: (id: number): Promise<{ inquiryId: number }> =>
    client.post(`/api/projects/${id}/revert`, {}),

  // Schedule
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
