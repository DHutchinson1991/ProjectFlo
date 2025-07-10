// Media types represent the actual media content
export type MediaType = "VIDEO" | "AUDIO" | "MUSIC";

// Scene types represent the purpose/category of the scene
export type SceneType =
    | "CEREMONY"          // Wedding ceremony scenes
    | "RECEPTION"         // Reception scenes  
    | "PORTRAIT"          // Portrait/couple shots
    | "FAMILY"            // Family photos/videos
    | "DETAIL"            // Ring, dress, venue details
    | "PREPARATION"       // Getting ready scenes
    | "DANCE"             // First dance, parent dances
    | "SPEECH"            // Toasts and speeches
    | "TRANSITION"        // Scene transitions
    | "GRAPHICS"          // Graphics overlays, titles
    | "MIXED";            // Scenes with multiple media types

export interface SceneMediaComponent {
    id: number;
    scene_id: number;
    media_type: MediaType;
    duration_seconds: number;
    is_primary: boolean;
    music_type?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface ScenesLibrary {
    id: number;
    name: string;
    description?: string;
    type: MediaType; // This comes from database - represents primary media type
    scene_type?: SceneType; // New field - represents the scene's purpose/category
    is_coverage_linked?: boolean;
    complexity_score: number;
    estimated_duration?: number;
    default_editing_style?: string;
    base_task_hours: string;
    created_at: string;
    updated_at: string;
    media_components?: SceneMediaComponent[];
}

export interface TimelineMediaComponent {
    id: number;
    media_type: MediaType;
    track_id: number;
    start_time: number;
    duration: number;
    is_primary: boolean;
    music_type?: string;
    notes?: string;
    scene_component_id?: number; // Reference to original scene component
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
    media_components?: TimelineMediaComponent[]; // Components within this scene
    original_scene_id?: number; // Reference to original scene library
    // New grouping properties
    group_id?: string;
    is_group_primary?: boolean;
    group_offset?: number; // Offset from group start time
}

export interface SceneGroup {
    id: string; // Unique identifier for the group
    originalSceneId?: number;
    name: string;
    scenes: TimelineScene[];
    color: string;
    isCollapsed?: boolean;
}

export interface ScenesLibraryState {
    availableScenes: ScenesLibrary[];
    loadingScenes: boolean;
    searchTerm: string;
    selectedCategory: string;
}
