/**
 * Subjects Domain Types
 * Canonical types for film subjects, scene/moment assignments, roles, and templates.
 */

export enum SubjectCategory {
  PEOPLE = 'PEOPLE',
  OBJECTS = 'OBJECTS',
  LOCATIONS = 'LOCATIONS',
}

export const SUBJECT_CATEGORY_LABELS: Record<SubjectCategory, string> = {
  [SubjectCategory.PEOPLE]: 'People',
  [SubjectCategory.OBJECTS]: 'Objects',
  [SubjectCategory.LOCATIONS]: 'Locations',
};

export const getSubjectCategoryIcon = (category: SubjectCategory): string => {
  const icons: Record<SubjectCategory, string> = {
    [SubjectCategory.PEOPLE]: '👥',
    [SubjectCategory.OBJECTS]: '🎁',
    [SubjectCategory.LOCATIONS]: '📍',
  };
  return icons[category];
};

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

export interface Subject {
  id: number;
  package_id: number;
  event_day_template_id?: number | null;
  count?: number;
  name: string;
  role_template_id: number;
  role?: {
    id: number;
    role_name: string;
    description?: string;
    is_group: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface SceneSubjectAssignment {
  id: number;
  moment_id: number;
  subject_id: number;
  priority: SubjectPriority;
  notes?: string | null;
  action_description?: string | null;
  created_at: string;
  updated_at: string;
  subject: Subject;
}

export interface CreateSubjectDto {
  name: string;
  role_template_id: number;
  event_day_template_id?: number;
  /** PackageActivity IDs from which this subject's moments should be scoped. Empty array = no assignment. Omit for manual (unscoped) additions. */
  source_activity_ids?: number[];
}

export interface UpdateSubjectDto {
  name?: string;
}

export interface SubjectRole {
  id: number;
  role_name: string;
  description?: string;
  is_group: boolean;
  order_index: number;
  brand_id: number;
}

export interface CreateSubjectRoleDto {
  role_name: string;
  description?: string;
  is_group?: boolean;
  order_index?: number;
  roles?: Array<{
    role_name: string;
    description?: string;
    is_group?: boolean;
    order_index?: number;
  }>;
}
