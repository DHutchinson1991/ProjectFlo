/**
 * Scene Audio Source Domain Types
 * Models audio layering — e.g., vows audio over a montage scene
 */

export enum AudioSourceType {
  MOMENT = 'MOMENT',
  BEAT = 'BEAT',
  SCENE = 'SCENE',
  ACTIVITY = 'ACTIVITY',
}

export enum AudioTrackType {
  SPEECH = 'SPEECH',
  AMBIENT = 'AMBIENT',
  MUSIC = 'MUSIC',
}

export interface SceneAudioSource {
  id: number;
  scene_id: number;
  source_type: AudioSourceType;
  source_activity_id?: number | null;
  source_moment_id?: number | null;
  source_scene_id?: number | null;
  track_type: AudioTrackType;
  start_offset_seconds?: number | null;
  duration_seconds?: number | null;
  order_index: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSceneAudioSourceDto {
  source_type: AudioSourceType;
  source_activity_id?: number;
  source_moment_id?: number;
  source_scene_id?: number;
  track_type?: AudioTrackType;
  start_offset_seconds?: number;
  duration_seconds?: number;
  order_index?: number;
  notes?: string;
}

export interface UpdateSceneAudioSourceDto {
  source_type?: AudioSourceType;
  source_activity_id?: number | null;
  source_moment_id?: number | null;
  source_scene_id?: number | null;
  track_type?: AudioTrackType;
  start_offset_seconds?: number | null;
  duration_seconds?: number | null;
  order_index?: number;
  notes?: string;
}
