import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { Subject, CreateSubjectDto, UpdateSubjectDto, SubjectTemplate, SceneSubjectAssignment, SubjectPriority } from '../types';

type UpdateSubjectAssignmentDto = {
  priority?: SubjectPriority;
  notes?: string | null;
  action_description?: string | null;
};

export const createSubjectsApi = (client: ApiClient) => ({
  // Subject roster for a film
  getSubjects: (filmId: number): Promise<Subject[]> =>
    client.get(`/api/subjects/films/${filmId}/subjects`),

  getFilmSubjects: (filmId: number): Promise<Subject[]> =>
    client.get(`/api/subjects/films/${filmId}/subjects`),

  createSubject: (filmId: number, dto: CreateSubjectDto): Promise<Subject> =>
    client.post(`/api/subjects/films/${filmId}/subjects`, dto),

  getSubject: (id: number): Promise<Subject> =>
    client.get(`/api/subjects/${id}`),

  updateSubject: (id: number, dto: UpdateSubjectDto): Promise<Subject> =>
    client.patch(`/api/subjects/${id}`, dto),

  deleteSubject: (id: number): Promise<void> =>
    client.delete(`/api/subjects/${id}`),

  // Templates (brand-scoped via header)
  getTemplates: (): Promise<SubjectTemplate[]> =>
    client.get('/api/subjects/templates/library'),

  // Scene assignments (computed from moment subjects)
  getSceneSubjects: (sceneId: number): Promise<SceneSubjectAssignment[]> =>
    client.get(`/api/subjects/scenes/${sceneId}`),

  removeFromScene: (sceneId: number, subjectId: number): Promise<void> =>
    client.delete(`/api/subjects/scenes/${sceneId}/subjects/${subjectId}`),

  // Moment assignments
  getMomentSubjects: (momentId: number): Promise<SceneSubjectAssignment[]> =>
    client.get(`/api/subjects/moments/${momentId}`),

  assignToMoment: (momentId: number, subjectId: number, priority: SubjectPriority): Promise<SceneSubjectAssignment> =>
    client.post(`/api/subjects/moments/${momentId}/assign`, { subject_id: subjectId, priority }),

  updateMomentAssignment: (
    momentId: number,
    subjectId: number,
    dto: UpdateSubjectAssignmentDto,
  ): Promise<SceneSubjectAssignment> =>
    client.patch(`/api/subjects/moments/${momentId}/subjects/${subjectId}`, dto),

  removeFromMoment: (momentId: number, subjectId: number): Promise<void> =>
    client.delete(`/api/subjects/moments/${momentId}/subjects/${subjectId}`),
});

export const subjectsApi = createSubjectsApi(apiClient);
export type SubjectsApi = ReturnType<typeof createSubjectsApi>;
