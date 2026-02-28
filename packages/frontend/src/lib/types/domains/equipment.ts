/**
 * Equipment Domain Types (Refactor v2)
 * Timeline tracks and enums for equipment/track management
 */

/**
 * TrackType Enum - Types of timeline tracks
 */
export enum TrackType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  GRAPHICS = 'GRAPHICS',
  MUSIC = 'MUSIC',
}

/**
 * FilmTimelineTrack - A track within a film's timeline
 * Represents a single track like "Camera 1", "Audio 1", "Graphics", "Music"
 * These are organized by TrackType
 */
export interface FilmTimelineTrack {
  id: number;
  film_id: number;
  name: string;
  type: TrackType;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relationships
  film?: {
    id: number;
    name: string;
  };
  camera_assignments?: any[]; // CameraSubjectAssignment[]
}

/**
 * CreateFilmTimelineTrackDto - Request payload for creating a timeline track
 */
export interface CreateFilmTimelineTrackDto {
  film_id: number;
  name: string;
  type: TrackType;
  order_index: number;
}

/**
 * UpdateFilmTimelineTrackDto - Request payload for updating a timeline track
 */
export interface UpdateFilmTimelineTrackDto {
  name?: string;
  order_index?: number;
  is_active?: boolean;
}

/**
 * Track Type Display Names
 */
export const TRACK_TYPE_LABELS: Record<TrackType, string> = {
  [TrackType.VIDEO]: 'Video',
  [TrackType.AUDIO]: 'Audio',
  [TrackType.GRAPHICS]: 'Graphics',
  [TrackType.MUSIC]: 'Music',
};

/**
 * Get color for track type (for UI visualization)
 */
export const getTrackTypeColor = (type: TrackType): string => {
  const colors: Record<TrackType, string> = {
    [TrackType.VIDEO]: '#3B82F6', // Blue
    [TrackType.AUDIO]: '#10B981', // Green
    [TrackType.GRAPHICS]: '#F59E0B', // Amber
    [TrackType.MUSIC]: '#8B5CF6', // Purple
  };
  return colors[type];
};
