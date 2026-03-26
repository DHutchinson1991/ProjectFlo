/**
 * TypeScript types for Film Scene Management
 * Corresponds to backend film-scenes-management.service.ts
 */

export type DurationMode = 'MOMENTS' | 'FIXED';
export type SceneType = 'VIDEO' | 'AUDIO' | 'GRAPHICS' | 'MUSIC';

export interface CreateSceneFromTemplateDto {
  template_scene_id: number;
  order_index?: number;
  custom_name?: string;
  copy_moments?: boolean;
}

export interface CreateBlankSceneDto {
  name: string;
  type: SceneType;
  description?: string;
  duration_mode: DurationMode;
  fixed_duration?: number;
  order_index?: number;
}

export interface UpdateDurationModeDto {
  duration_mode: DurationMode;
  fixed_duration?: number;
}

export interface SceneDurationInfo {
  scene_id: number;
  scene_name: string;
  duration_mode: DurationMode;
  fixed_duration: number | null;
  moments_count: number;
  moments_total_duration: number;
  calculated_duration: number;
}

export interface FilmLocalScene {
  id: number;
  film_id: number;
  original_scene_id: number | null;
  name: string;
  type: SceneType;
  description: string | null;
  complexity_score: number | null;
  estimated_duration: number | null;
  default_editing_style: string | null;
  base_task_hours: string | null;
  order_index: number;
  editing_style: string | null;
  duration_override: number | null;
  duration_mode: DurationMode | null;
  fixed_duration: number | null;
  calculated_task_hours: string | null;
  calculated_base_price: string | null;
  created_at: string;
  updated_at: string;
  media_components?: FilmLocalSceneMediaComponent[];
  original_scene?: {
    id: number;
    name: string;
    type: SceneType;
    moments?: SceneMoment[];
  };
}

export interface FilmLocalSceneMediaComponent {
  id: number;
  film_local_scene_id: number;
  original_component_id: number | null;
  media_type: string;
  duration_seconds: number;
  is_primary: boolean;
  music_type: string | null;
  music_weight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SceneMoment {
  id: number;
  scene_id: number;
  project_id: number | null;
  template_id: number | null;
  name: string;
  description: string | null;
  order_index: number;
  duration: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  template?: {
    id: number;
    name: string;
    description: string | null;
  };
}
