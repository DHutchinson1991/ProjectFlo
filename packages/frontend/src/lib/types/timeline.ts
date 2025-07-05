/**
 * Timeline and editing workflow types
 */

export interface TimelineSceneData {
  id?: number;
  film_id: number;
  scene_id: number;
  layer_id: number;
  start_time_seconds: number;
  duration_seconds: number;
  order_index?: number;
  notes?: string;
}

export interface TimelineLayerData {
  id: number;
  name: string;
  order_index: number;
  color_hex: string;
  description?: string;
  is_active: boolean;
}

export interface TimelineAnalyticsData {
  totalDuration: number;
  totalScenes: number;
  layerStats: Record<string, { count: number; totalDuration: number }>;
  sceneStats: Record<string, { count: number; totalDuration: number }>;
  timelineHealth: {
    hasGaps: { start: number; end: number; duration: number }[];
    hasOverlaps: {
      scene1: TimelineSceneData;
      scene2: TimelineSceneData;
      overlapDuration: number;
    }[];
  };
}
