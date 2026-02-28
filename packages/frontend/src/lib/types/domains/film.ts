/**
 * Film Domain Types (Refactor v2)
 * Core film, timeline tracks, and timeline layer definitions
 */

import type { FilmScene } from './scenes';
import type { FilmSubject } from './subjects';
import type { FilmTimelineTrack } from './equipment';
import type { FilmLocationAssignment } from '../locations';

/**
 * Film - Core film entity
 * Represents a complete wedding film project with scenes, subjects, and timeline tracks
 */
export interface Film {
  id: number;
  name: string;
  brand_id: number;
  created_at: string;
  updated_at: string;

  // Relationships
  brand?: {
    id: number;
    name: string;
    display_name?: string;
  };
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
}

/**
 * UpdateFilmDto - Request payload for updating a film
 */
export interface UpdateFilmDto {
  name?: string;
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
