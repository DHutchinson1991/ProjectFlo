/**
 * Subjects Domain Types (Refactor v2)
 * Subject categories and definitions for films and templates
 */

/**
 * SubjectCategory Enum - Types of subjects to be filmed
 */
export enum SubjectCategory {
  PEOPLE = 'PEOPLE',
  OBJECTS = 'OBJECTS',
  LOCATIONS = 'LOCATIONS',
}

/**
 * SubjectPriority - Scene assignment priority
 */
export enum SubjectPriority {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  BACKGROUND = 'BACKGROUND',
}

/**
 * SubjectTemplate - Template for suggested subjects in scenes
 * System defaults like "Bride", "Groom", "Rings", etc.
 */
export interface SubjectTemplate {
  id: number;
  name: string;
  category: SubjectCategory;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * FilmSubject - A subject assigned to a specific film
 * Can be custom (user-created) or from a template with optional role
 */
export interface FilmSubject {
  id: number;
  film_id: number;
  name: string;
  category: SubjectCategory;
  role_template_id?: number;
  role?: {
    id: number;
    role_name: string;
    description?: string;
    is_core: boolean;
  };
  is_custom: boolean;
  created_at: string;
  updated_at: string;

  // Relationships
  film?: {
    id: number;
    name: string;
  };
}

/**
 * SceneSubjectAssignment - Subject assigned to a film scene
 */
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

/**
 * CreateFilmSubjectDto - Request payload for creating a film subject
 */
export interface CreateFilmSubjectDto {
  film_id?: number;
  name: string;
  category: SubjectCategory;
  role_template_id?: number;
  is_custom?: boolean;
}

/**
 * UpdateFilmSubjectDto - Request payload for updating a film subject
 */
export interface UpdateFilmSubjectDto {
  name?: string;
  category?: SubjectCategory;
  is_custom?: boolean;
}

/**
 * Subject Category Display Names
 */
export const SUBJECT_CATEGORY_LABELS: Record<SubjectCategory, string> = {
  [SubjectCategory.PEOPLE]: 'People',
  [SubjectCategory.OBJECTS]: 'Objects',
  [SubjectCategory.LOCATIONS]: 'Locations',
};

/**
 * Get icon for subject category
 */
export const getSubjectCategoryIcon = (category: SubjectCategory): string => {
  const icons: Record<SubjectCategory, string> = {
    [SubjectCategory.PEOPLE]: '👥',
    [SubjectCategory.OBJECTS]: '🎁',
    [SubjectCategory.LOCATIONS]: '📍',
  };
  return icons[category];
};
