/**
 * TypeScript types for Film Timeline Tracks Management
 * Corresponds to backend film-timeline-tracks.service.ts
 */

export type TrackType = 'VIDEO' | 'AUDIO' | 'GRAPHICS' | 'MUSIC';

/** Operator/crew info included with track responses */
export interface TrackOperator {
  id: number;
  crew_color?: string | null;
  contact: {
    first_name?: string | null;
    last_name?: string | null;
  };
}

export interface TimelineTrack {
  id: number;
  film_id: number;
  track_type: TrackType;
  track_label: string | null;
  order_index: number;
  is_active: boolean;
  is_unmanned: boolean;
  crew_member_id: number | null;
  crew_member: TrackOperator | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateTracksDto {
  overwrite?: boolean;
}

export interface UpdateTrackDto {
  track_label?: string;
  order_index?: number;
  is_active?: boolean;
  is_unmanned?: boolean;
  crew_member_id?: number | null;
}

export interface ReorderTracksDto {
  track_orders: Array<{
    trackId: number;
    newOrderIndex: number;
  }>;
}

export interface TracksByType {
  graphics: TimelineTrack[];
  video: TimelineTrack[];
  audio: TimelineTrack[];
  music: TimelineTrack[];
}

export interface TrackStatistics {
  total: number;
  byType: Record<string, number>;
  active: number;
  inactive: number;
}
