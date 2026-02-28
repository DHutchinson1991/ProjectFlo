/**
 * Beats Domain Types
 * Montage beats for film scenes
 */

export interface SceneBeat {
  id: number;
  film_scene_id: number;
  name: string;
  order_index: number;
  shot_count?: number | null;
  duration_seconds: number;
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
}

export interface UpdateSceneBeatDto {
  name?: string;
  order_index?: number;
  duration_seconds?: number;
  shot_count?: number | null;
}
