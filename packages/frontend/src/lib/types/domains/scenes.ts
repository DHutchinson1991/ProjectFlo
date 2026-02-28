/**
 * Scenes Domain Types (Refactor v2)
 * Film scenes, moments, and scene templates
 * 
 * Merged with ContentBuilder scene types for unified timeline scene handling
 */

import type { SceneMoment } from './../moments';
import type { SceneBeat } from './beats';
import type { SceneMusic } from './music';
import type { FilmSceneLocationAssignment } from '../locations';

/**
 * SceneType Enum - Types of wedding scenes
 */
export enum SceneType {
  MOMENTS = 'MOMENTS',
  MONTAGE = 'MONTAGE',
}

/**
 * SceneTemplate - Template for building scenes
 * Suggests which subjects should be filmed and recommended moments
 */
export interface SceneTemplate {
  id: number;
  name: string;
  type?: SceneType;
  created_at: string;
  updated_at: string;
  recording_setup?: {
    camera_count?: number;
    audio_count?: number;
    graphics_enabled?: boolean;
  } | null;
  suggested_subjects?: {
    id: number;
    name: string;
    category: string;
  }[];
  moments_count?: number;

  // Relationships
  moments?: {
    id: number;
    name: string;
    order_index: number;
    estimated_duration?: number;
  }[];
}

/**
 * FilmScene - A scene within a film
 * Contains multiple moments that together form a complete scene
 * Example: "Getting Ready" scene with moments like "Bride Makeup", "Bride Dress", etc.
 */
export interface FilmScene {
  id: number;
  film_id: number;
  scene_template_id?: number;
  name: string;
  shot_count?: number | null;
  duration_seconds?: number | null;
  order_index: number;
  created_at: string;
  updated_at: string;

  // Relationships
  film?: {
    id: number;
    name: string;
  };
  template?: SceneTemplate;
  moments?: SceneMoment[];
  beats?: SceneBeat[];
  scene_music?: SceneMusic;
  location_assignment?: FilmSceneLocationAssignment | null;
}

/**
 * CreateFilmSceneDto - Request payload for creating a film scene
 */
export interface CreateFilmSceneDto {
  film_id: number;
  scene_template_id?: number;
  name: string;
  shot_count?: number | null;
  duration_seconds?: number | null;
  order_index: number;
}

/**
 * UpdateFilmSceneDto - Request payload for updating a film scene
 */
export interface UpdateFilmSceneDto {
  name?: string;
  order_index?: number;
  scene_template_id?: number;
  shot_count?: number | null;
  duration_seconds?: number | null;
}

/**
 * Scene Type Display Names
 */
export const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  [SceneType.MOMENTS]: 'Moments',
  [SceneType.MONTAGE]: 'Montage',
};

/**
 * Get emoji for scene type
 */
export const getSceneTypeEmoji = (type: SceneType): string => {
  const emojis: Record<SceneType, string> = {
    [SceneType.MOMENTS]: '🧩',
    [SceneType.MONTAGE]: '🎞️',
  };
  return emojis[type];
};

/**
 * FilmSceneWithMoments - Film scene with all nested moments
 */
export interface FilmSceneWithMoments extends FilmScene {
  moments: SceneMoment[];
}

// ============================================================================
// CONTENTBUILDER SCENE TYPES (merged from ContentBuilder/types/sceneTypes.ts)
// ============================================================================

/**
 * ScenesLibrary - Scene from the media library
 * Represents pre-built scenes available for use in timelines
 */
export interface ScenesLibrary {
  id: number;
  name: string;
  description?: string;
  type?: SceneType | 'VIDEO' | 'AUDIO' | 'MUSIC';
  scene_type?: 'CEREMONY' | 'RECEPTION' | 'PORTRAIT' | 'FAMILY' | 'DETAIL' | 'PREPARATION' | 'DANCE' | 'SPEECH' | 'TRANSITION' | 'GRAPHICS' | 'MIXED';
  is_coverage_linked?: boolean;
  complexity_score?: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours?: string;
  created_at?: string;
  updated_at?: string;
  media_components?: SceneMediaComponent[];
  moments?: {
    id: number;
    name: string;
    order_index: number;
    estimated_duration?: number;
    duration?: number;
    duration_seconds?: number;
  }[];
  moments_count?: number;
  suggested_subjects?: {
    id: number;
    name: string;
    category: string;
  }[];
  recording_setup?: {
    camera_count?: number;
    audio_count?: number;
    graphics_enabled?: boolean;
  } | null;
}

/**
 * SceneMediaComponent - Individual media component within a scene
 */
export interface SceneMediaComponent {
  id: number;
  scene_id: number;
  media_type: 'VIDEO' | 'AUDIO' | 'MUSIC';
  duration_seconds: number;
  is_primary: boolean;
  isCoverage?: boolean;
  music_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * TimelineMediaComponent - Media component on the timeline
 */
export interface TimelineMediaComponent {
  id: number;
  media_type: 'VIDEO' | 'AUDIO' | 'MUSIC';
  track_id: number;
  start_time: number;
  duration: number;
  is_primary: boolean;
  music_type?: string;
  notes?: string;
  scene_component_id?: number;
}

/**
 * TimelineSceneBuilder - Scene on the timeline for editing
 * Note: Distinct from FilmScene (domain model) - this is for UI editing
 */
export interface TimelineSceneBuilder {
  id: number;
  name: string;
  start_time: number;
  duration: number;
  track_id: number;
  scene_type: 'video' | 'audio' | 'graphics' | 'music';
  color: string;
  description?: string;
  thumbnail?: string;
  locked?: boolean;
  database_type?: 'GRAPHICS' | 'VIDEO' | 'AUDIO' | 'MUSIC';
  media_components?: TimelineMediaComponent[];
  original_scene_id?: number;
  group_id?: string;
  is_group_primary?: boolean;
  group_offset?: number;
}

/**
 * SceneGroup - Grouped scenes on timeline
 */
export interface SceneGroup {
  id: string;
  originalSceneId?: number;
  name: string;
  scenes: TimelineSceneBuilder[];
  color: string;
  isCollapsed?: boolean;
}

/**
 * ScenesLibraryState - UI state for scenes library
 */
export interface ScenesLibraryState {
  availableScenes: ScenesLibrary[];
  loadingScenes: boolean;
  searchTerm: string;
  selectedCategory: string;
}
