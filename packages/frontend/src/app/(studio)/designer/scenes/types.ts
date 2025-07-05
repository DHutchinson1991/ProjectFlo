// Types for scenes management
export interface ScenesLibrary {
  id: number;
  name: string;
  description: string;
  media_type: "VIDEO" | "AUDIO" | "MUSIC";
  complexity_score: number;
  estimated_duration: number;
  base_task_hours: string;
  is_coverage_linked: boolean;
  usage_count: number;
  performance_score: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export interface SceneAnalytics {
  total_usage: number;
  recent_usage: number;
  average_task_hours: number;
  efficiency_score: number;
}

export interface SceneFilters {
  searchTerm: string;
  mediaType: "ALL" | "VIDEO" | "AUDIO" | "MUSIC";
}

export interface SceneFormData {
  name: string;
  description: string;
  media_type: "VIDEO" | "AUDIO" | "MUSIC";
  complexity_score: number;
  estimated_duration: number;
  base_task_hours: string;
  is_coverage_linked: boolean;
}
