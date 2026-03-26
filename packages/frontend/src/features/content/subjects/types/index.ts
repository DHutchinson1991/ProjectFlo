/**
 * Subjects Domain Types
 * Canonical types for film subjects, scene/moment assignments, roles, and templates.
 */

export enum SubjectPriority {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  BACKGROUND = 'BACKGROUND',
}

export interface SubjectTemplate {
  id: number;
  name: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilmSubject {
  id: number;
  film_id: number;
  name: string;
  role_template_id: number;
  role?: {
    id: number;
    role_name: string;
    description?: string;
    is_core: boolean;
    is_group: boolean;
  };
  created_at: string;
  updated_at: string;
  film?: { id: number; name: string };
}

export interface SceneSubjectAssignment {
  id: number;
  scene_id?: number | null;
  moment_id?: number | null;
  subject_id: number;
  priority: SubjectPriority;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  subject: FilmSubject;
}

export interface CreateFilmSubjectDto {
  film_id?: number;
  name: string;
  role_template_id: number;
  /** PackageActivity IDs from which this subject's moments should be scoped. Empty array = no assignment. Omit for manual (unscoped) additions. */
  source_activity_ids?: number[];
}

export interface UpdateFilmSubjectDto {
  name?: string;
}

export interface SubjectRole {
  id: number;
  role_name: string;
  description?: string;
  is_core: boolean;
  is_group: boolean;
  order_index: number;
  brand_id: number;
}

export interface CreateSubjectRoleDto {
  role_name: string;
  description?: string;
  is_core?: boolean;
  is_group?: boolean;
  order_index?: number;
  roles?: Array<{
    role_name: string;
    description?: string;
    is_core?: boolean;
    is_group?: boolean;
    order_index?: number;
  }>;
}
