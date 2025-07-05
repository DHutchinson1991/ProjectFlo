/**
 * Film and media production types
 */

export interface FilmData {
  id: number;
  name: string;
  description?: string;
  type?: string;
  version?: string;
  includes_music?: boolean;
  delivery_timeline?: number;
  workflow_template_id?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface CreateFilmData {
  name: string;
  description?: string;
}

export interface UpdateFilmData {
  name?: string;
  description?: string;
}

export interface EditingStyleData {
  id: number;
  name: string;
  description?: string;
}

export interface CreateEditingStyleData {
  name: string;
  description?: string;
}

export interface UpdateEditingStyleData {
  name?: string;
  description?: string;
}

// Scene related types
export interface ScenesLibrary {
  id: number;
  name: string;
  description: string;
  media_type: "VIDEO" | "AUDIO" | "MUSIC";
  complexity_score: number;
  estimated_duration: number;
  base_task_hours: string;
  is_coverage_linked: boolean;
  usage_count: number;
  performance_score: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export interface CreateSceneDto {
  name: string;
  description: string;
  media_type: "VIDEO" | "AUDIO" | "MUSIC";
  complexity_score: number;
  estimated_duration: number;
  base_task_hours: string;
  is_coverage_linked: boolean;
}

export type UpdateSceneDto = Partial<CreateSceneDto>;

export interface CoverageSceneData {
  id: number;
  name: string;
  description?: string;
}

export interface CreateCoverageSceneData {
  name: string;
  description?: string;
}

export interface UpdateCoverageSceneData {
  name?: string;
  description?: string;
}
