import type { ApiClient } from '@/lib/api/api-client.types';
import { apiClient } from '@/lib/api';
import type { FilmSubject, CreateFilmSubjectDto, UpdateFilmSubjectDto, SubjectTemplate, SceneSubjectAssignment, SubjectPriority } from '../types';

export const createSubjectsApi = (client: ApiClient) => ({
  // Film subjects
  getFilmSubjects: (filmId: number): Promise<FilmSubject[]> =>
    client.get(`/api/subjects/films/${filmId}/subjects`),

  createSubject: (filmId: number, dto: CreateFilmSubjectDto): Promise<FilmSubject> =>
    client.post(`/api/subjects/films/${filmId}/subjects`, dto),

  getSubject: (id: number): Promise<FilmSubject> =>
    client.get(`/api/subjects/${id}`),

  updateSubject: (id: number, dto: UpdateFilmSubjectDto): Promise<FilmSubject> =>
    client.patch(`/api/subjects/${id}`, dto),

  deleteSubject: (id: number): Promise<void> =>
    client.delete(`/api/subjects/${id}`),

  // Templates (brand-scoped via header)
  getTemplates: (): Promise<SubjectTemplate[]> =>
    client.get('/api/subjects/templates/library'),

  // Scene assignments
  getSceneSubjects: (sceneId: number): Promise<SceneSubjectAssignment[]> =>
    client.get(`/api/subjects/scenes/${sceneId}`),

  assignToScene: (sceneId: number, subjectId: number, priority: SubjectPriority): Promise<SceneSubjectAssignment> =>
    client.post(`/api/subjects/scenes/${sceneId}/assign`, { subject_id: subjectId, priority }),

  removeFromScene: (sceneId: number, subjectId: number): Promise<void> =>
    client.delete(`/api/subjects/scenes/${sceneId}/subjects/${subjectId}`),

  // Moment assignments
  getMomentSubjects: (momentId: number): Promise<SceneSubjectAssignment[]> =>
    client.get(`/api/subjects/moments/${momentId}`),

  assignToMoment: (momentId: number, subjectId: number, priority: SubjectPriority): Promise<SceneSubjectAssignment> =>
    client.post(`/api/subjects/moments/${momentId}/assign`, { subject_id: subjectId, priority }),

  removeFromMoment: (momentId: number, subjectId: number): Promise<void> =>
    client.delete(`/api/subjects/moments/${momentId}/subjects/${subjectId}`),
});

export const subjectsApi = createSubjectsApi(apiClient as unknown as ApiClient);
export type SubjectsApi = ReturnType<typeof createSubjectsApi>;
