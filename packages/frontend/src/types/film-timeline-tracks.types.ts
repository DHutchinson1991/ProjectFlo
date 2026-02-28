/**
 * TypeScript types for Film Timeline Tracks Management
 * Corresponds to backend film-timeline-tracks.service.ts
 */

export type TrackType = 'VIDEO' | 'AUDIO' | 'GRAPHICS' | 'MUSIC';

/** Operator info included with track responses */
export interface TrackOperator {
  id: number;
  name: string;
  role: string;
  color: string;
}

export interface TimelineTrack {
  id: number;
  film_id: number;
  track_type: TrackType;
  track_label: string | null;
  order_index: number;
  is_active: boolean;
  operator_template_id: number | null;
  operator_template: TrackOperator | null;
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
  operator_template_id?: number | null;
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
