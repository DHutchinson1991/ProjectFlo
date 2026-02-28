/**
 * Moments Domain Types (Refactor v2)
 * Scene moments and related recording setup types
 * 
 * Merged with ContentBuilder moment types for unified timeline moment handling
 */

import type { FilmScene } from './scenes';
import type { MomentRecordingSetup } from './recording-setup';
import type { MomentMusic } from './music';

/**
 * SceneMoment - A moment within a scene
 * Individual moments that together compose a scene
 * Example: "Bride Putting on Dress" is a moment within "Getting Ready" scene
 */
export interface SceneMoment {
  id: number;
  film_scene_id: number;
  name: string;
  order_index: number;
  duration: number; // in seconds
  created_at: string;
  updated_at: string;

  // Relationships
  film_scene?: FilmScene;
  recording_setup?: MomentRecordingSetup;
  moment_music?: MomentMusic;
}

/**
 * CreateSceneMomentDto - Request payload for creating a scene moment
 */
export interface CreateSceneMomentDto {
  film_scene_id: number;
  name: string;
  order_index: number;
  duration?: number;
}

/**
 * UpdateSceneMomentDto - Request payload for updating a scene moment
 */
export interface UpdateSceneMomentDto {
  name?: string;
  order_index?: number;
  duration?: number;
}

/**
 * SceneMomentTemplate - Template for moments within scenes
 * Suggests moments that should be filmed for a given scene type
 */
export interface SceneMomentTemplate {
  id: number;
  scene_template_id: number;
  name: string;
  order_index: number;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;

  // Relationships
  scene_template?: {
    id: number;
    name: string;
  };
}

/**
 * SceneMomentWithSetup - Scene moment with full recording setup details
 */
export interface SceneMomentWithSetup extends SceneMoment {
  recording_setup: MomentRecordingSetup;
}

/**
 * SceneMomentWithMusic - Scene moment with music information
 */
export interface SceneMomentWithMusic extends SceneMoment {
  moment_music: MomentMusic;
}

// ============================================================================
// CONTENTBUILDER MOMENT TYPES (merged from ContentBuilder/types/momentTypes.ts)
// ============================================================================

/**
 * MomentCoverage - Coverage assignment for a moment
 */
export interface MomentCoverage {
  id: number;
  coverage_id: number;
  priority_order: number;
  moment_id?: number;
  assignment?: string;
  coverage?: {
    id: number;
    name: string;
    assignment?: string;
    coverage_type?: 'VIDEO' | 'AUDIO';
    audio_equipment?: string;
    shot_type?: string;
  };
}

/**
 * MomentMusicInfo - Music assignment for a moment
 */
export interface MomentMusicInfo {
  id: number;
  moment_id: number;
  music_library_item_id?: number;
  music_name?: string;
  artist?: string;
  duration?: number;
  music_type?: 'NONE' | 'SCENE_MATCHED' | 'ORCHESTRAL' | 'PIANO' | 'MODERN' | 'VINTAGE';
  file_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * TimelineVideoLayer - Video track on timeline
 */
export interface TimelineVideoLayer {
  id: string;
  type: 'VIDEO';
  assignment: string;
  name: string;
  color: string;
}

/**
 * TimelineAudioLayer - Audio track on timeline
 */
export interface TimelineAudioLayer {
  id: string;
  type: 'AUDIO';
  assignment: string;
  name: string;
  color: string;
}

/**
 * TimelineMusicLayer - Music track on timeline
 */
export interface TimelineMusicLayer {
  id: string;
  type: 'MUSIC';
  assignment?: string;
  name: string;
  color: string;
}

/**
 * TimelineLayerUnion - Union type for all timeline layer types
 */
export type TimelineLayerUnion = TimelineVideoLayer | TimelineAudioLayer | TimelineMusicLayer;

/**
 * TimelineSceneMoment - Moment on the timeline
 */
export interface TimelineSceneMoment {
  id: number;
  scene_id: number;
  project_id?: number;
  template_id?: number;
  name: string;
  description?: string;
  order_index: number;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  coverage_items?: MomentCoverage[];
  music?: MomentMusicInfo | null;
  start_time?: number;
  coverage?: Record<string, boolean>;
}

/**
 * TimelineSceneWithMoments - Scene containing multiple moments
 */
export interface TimelineSceneWithMoments {
  id: number;
  film_id: number;
  original_scene_id?: number;
  name: string;
  type: 'VIDEO' | 'AUDIO' | 'MUSIC';
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  media_components?: any[];
  original_scene?: {
    id: number;
    name: string;
    type: string;
    moments?: TimelineSceneMoment[];
  };
  total_duration?: number;
  buffer_duration?: number;
  layers?: TimelineLayerUnion[];
}
