/**
 * Timeline Track Types
 * Track type enums and FilmTimelineTrack for equipment/track management
 */

export enum TrackType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  GRAPHICS = 'GRAPHICS',
  MUSIC = 'MUSIC',
}

export interface FilmTimelineTrack {
  id: number;
  film_id: number;
  name: string;
  type: TrackType;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  film?: {
    id: number;
    name: string;
  };
  camera_assignments?: any[];
}

export interface CreateFilmTimelineTrackDto {
  film_id: number;
  name: string;
  type: TrackType;
  order_index: number;
}

export interface UpdateFilmTimelineTrackDto {
  name?: string;
  type?: TrackType;
  order_index?: number;
  is_active?: boolean;
}

export const TRACK_TYPE_LABELS: Record<TrackType, string> = {
  [TrackType.VIDEO]: 'Video',
  [TrackType.AUDIO]: 'Audio',
  [TrackType.GRAPHICS]: 'Graphics',
  [TrackType.MUSIC]: 'Music',
};

export const getTrackTypeColor = (type: TrackType): string => {
  const colors: Record<TrackType, string> = {
    [TrackType.VIDEO]: '#3B82F6',
    [TrackType.AUDIO]: '#10B981',
    [TrackType.GRAPHICS]: '#F59E0B',
    [TrackType.MUSIC]: '#8B5CF6',
  };
  return colors[type];
};
