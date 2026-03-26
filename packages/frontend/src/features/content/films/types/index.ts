/**
 * Film Domain Types
 * Core film, timeline tracks, and timeline layer definitions
 */

import type { FilmScene } from '@/features/content/scenes/types';
import type { FilmSubject } from '@/features/content/subjects/types';
import type { FilmTimelineTrack } from '@/lib/types/domains/equipment';
import type { FilmLocationAssignment } from '@/features/workflow/locations/types';
import type { MontagePreset } from '@/lib/types/domains/montage-presets';

/**
 * FilmType Enum - Types of wedding films
 */
export enum FilmType {
  ACTIVITY = 'ACTIVITY',
  FEATURE = 'FEATURE',
  MONTAGE = 'MONTAGE',
  RAW_FOOTAGE = 'RAW_FOOTAGE',
}

/**
 * Film - Core film entity
 * Represents a complete wedding film project with scenes, subjects, and timeline tracks
 */
export interface Film {
  id: number;
  name: string;
  brand_id: number;
  film_type: FilmType;
  montage_preset_id?: number | null;
  target_duration_min?: number | null;
  target_duration_max?: number | null;
  created_at: string;
  updated_at: string;

  // Relationships
  brand?: {
    id: number;
    name: string;
    display_name?: string;
  };
  montage_preset?: MontagePreset | null;
  tracks?: FilmTimelineTrack[];
  subjects?: FilmSubject[];
  locations?: FilmLocationAssignment[];
  scenes?: FilmScene[];
}

/**
 * CreateFilmDto - Request payload for creating a new film
 */
export interface CreateFilmDto {
  name: string;
  brand_id: number;
  film_type?: FilmType;
  montage_preset_id?: number;
  target_duration_min?: number;
  target_duration_max?: number;
  num_cameras?: number;
  num_audio?: number;
}

/**
 * UpdateFilmDto - Request payload for updating a film
 */
export interface UpdateFilmDto {
  name?: string;
  film_type?: FilmType;
  montage_preset_id?: number | null;
  target_duration_min?: number | null;
  target_duration_max?: number | null;
}

/**
 * TimelineLayer - Track organization metadata
 * Describes different layer types like "Video", "Audio", "Music", "Graphics"
 * Used to organize FilmTimelineTrack records
 */
export interface TimelineLayer {
  id: number;
  name: string;
  order_index: number;
  color_hex: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * CreateTimelineLayerDto - Request payload for creating a timeline layer
 */
export interface CreateTimelineLayerDto {
  name: string;
  order_index: number;
  color_hex: string;
  description?: string;
}

/**
 * UpdateTimelineLayerDto - Request payload for updating a timeline layer
 */
export interface UpdateTimelineLayerDto {
  name?: string;
  order_index?: number;
  color_hex?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * FilmResponse - API response DTO for film with nested relationships
 */
export interface FilmResponse extends Film {
  tracks: FilmTimelineTrack[];
  subjects: FilmSubject[];
  scenes: FilmScene[];
}
