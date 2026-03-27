/**
 * Beat Domain Types
 * Montage beats for film scenes
 */

export interface SceneBeat {
  id: number;
  film_scene_id: number;
  name: string;
  order_index: number;
  shot_count?: number | null;
  duration_seconds: number;
  source_activity_id?: number | null;
  source_moment_id?: number | null;
  source_scene_id?: number | null;
  created_at: string;
  updated_at: string;
  recording_setup?: {
    id: number;
    camera_track_ids: number[];
    audio_track_ids: number[];
    graphics_enabled: boolean;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface CreateSceneBeatDto {
  name: string;
  order_index?: number;
  duration_seconds?: number;
  shot_count?: number | null;
  source_activity_id?: number;
  source_moment_id?: number;
  source_scene_id?: number;
}

export interface UpdateSceneBeatDto {
  name?: string;
  order_index?: number;
  duration_seconds?: number;
  shot_count?: number | null;
}
