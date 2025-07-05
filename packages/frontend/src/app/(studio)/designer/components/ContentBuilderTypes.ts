export interface ScenesLibrary {
  id: number;
  name: string;
  description?: string;
  type: "GRAPHICS" | "VIDEO" | "AUDIO" | "MUSIC";
  is_coverage_linked?: boolean;
  complexity_score: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineScene {
  id: number;
  name: string;
  start_time: number; // in seconds
  duration: number; // in seconds
  track_id: number;
  scene_type: "video" | "audio" | "graphics" | "music";
  color: string;
  description?: string;
  thumbnail?: string;
  locked?: boolean;
  database_type?: "GRAPHICS" | "VIDEO" | "AUDIO" | "MUSIC"; // Map to database SceneType
}

export interface TimelineTrack {
  id: number;
  name: string;
  track_type: "video" | "audio" | "graphics" | "music";
  height: number;
  visible: boolean;
  muted?: boolean;
  color: string;
  order_index: number;
}

export interface DatabaseLayer {
  id: number;
  name: string;
  order_index: number;
  color_hex: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentBuilderProps {
  initialScenes?: TimelineScene[];
  onSave?: (scenes: TimelineScene[]) => void;
  onExport?: (format: string) => void;
  readOnly?: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
}

export interface DragState {
  draggedScene: TimelineScene | null;
  draggedLibraryScene: ScenesLibrary | null;
  dragOffset: { x: number; y: number };
  isDragActive: boolean;
}

export interface ViewState {
  zoomLevel: number; // pixels per second
  snapToGrid: boolean;
  gridSize: number; // seconds
  selectedScene: TimelineScene | null;
  viewportLeft: number; // timeline scroll position in pixels
  viewportWidth: number; // visible viewport width in pixels;
}

export interface ScenesLibraryState {
  availableScenes: ScenesLibrary[];
  loadingScenes: boolean;
  searchTerm: string;
  selectedCategory: string;
}
