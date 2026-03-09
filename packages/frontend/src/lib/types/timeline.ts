/**
 * Timeline and editing workflow types
 * 
 * Contains both core timeline domain types and ContentBuilder UI component types.
 * Core types: TimelineSceneData, TimelineLayerData, TimelineAnalyticsData
 * UI types: TimelineScene, TimelineTrack, DragState, ViewState, PlaybackState
 * Component prop types: ContentBuilderProps, SaveState, PlaybackScreenProps, etc.
 */

import type { ReactNode } from 'react';
import type { ScenesLibrary } from './domains/scenes';
import type { SceneBeat } from './domains/beats';
import type { FilmEquipmentAssignmentsBySlot } from '../../types/film-equipment.types';

// ============================================================================
// CORE TIMELINE DOMAIN TYPES
// ============================================================================

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

// ============================================================================
// CONTENTBUILDER UI TYPES (from old ContentBuilder/types/)
// ============================================================================

export type MediaType = "VIDEO" | "AUDIO" | "MUSIC";

export type ContentBuilderSceneType =
    | "MOMENTS" | "MONTAGE"
    | "CEREMONY" | "RECEPTION" | "PORTRAIT" | "FAMILY" | "DETAIL"
    | "PREPARATION" | "DANCE" | "SPEECH" | "TRANSITION" | "GRAPHICS" | "MIXED";

export interface SceneMediaComponent {
    id: number;
    scene_id: number;
    media_type: MediaType;
    duration_seconds: number;
    is_primary: boolean;
    isCoverage?: boolean;
    music_type?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// ScenesLibrary and ScenesLibraryState moved to domains/scenes.ts

export interface TimelineMediaComponent {
    id: number;
    media_type: MediaType;
    track_id: number;
    start_time: number;
    duration: number;
    is_primary: boolean;
    music_type?: string;
    notes?: string;
    scene_component_id?: number;
}

export interface TimelineScene {
    id: number;
    film_id?: number;
    name: string;
    start_time: number;
    duration: number;
    track_id: number;
    scene_type: "video" | "audio" | "graphics" | "music";
    color: string;
    description?: string;
    thumbnail?: string;
    locked?: boolean;
    database_type?: "GRAPHICS" | "VIDEO" | "AUDIO" | "MUSIC" | "MOMENTS_CONTAINER";
    media_components?: TimelineMediaComponent[];
    original_scene_id?: number;
    group_id?: string;
    is_group_primary?: boolean;
    group_offset?: number;
    order_index?: number;
    moments?: any[];
    beats?: SceneBeat[];
    coverage_items?: any[];
    music?: any;
    scene_music?: any;
    recording_setup?: any;
    recording_setup_template?: {
        camera_count?: number;
        audio_count?: number;
        graphics_enabled?: boolean;
    } | null;
    shot_count?: number | null;
    duration_seconds?: number | null;
    scene_template_type?: "MOMENTS" | "MONTAGE";
}

export interface SceneGroup {
    id: string;
    originalSceneId?: number;
    name: string;
    scenes: TimelineScene[];
    color: string;
    isCollapsed?: boolean;
}

// ScenesLibraryState moved to domains/scenes.ts

export interface TimelineTrack {
    id: number;
    name: string;
    track_type: "video" | "audio" | "graphics" | "music";
    height: number;
    visible: boolean;
    muted?: boolean;
    color: string;
    order_index: number;
    /** Crew member assigned to this track (from backend) */
    contributor_id?: number | null;
    contributor?: {
        id: number;
        crew_color?: string | null;
        contact?: { first_name?: string | null; last_name?: string | null };
    } | null;
    /** Whether this track is flagged as unmanned (no operator) */
    is_unmanned?: boolean | null;
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

export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    totalDuration: number;
    playbackSpeed: number;
}

// ============================================================================
// DRAG & DROP INTERACTION TYPES
// ============================================================================

export interface DragState {
    draggedScene: TimelineScene | null;
    draggedLibraryScene: ScenesLibrary | null;
    dragOffset: { x: number; y: number };
    isDragActive: boolean;
    hasCollision?: boolean;
    previewPosition?: { startTime: number; trackId: number };
}

export interface ViewState {
    zoomLevel: number;
    snapToGrid: boolean;
    gridSize: number;
    selectedScene: TimelineScene | null;
    viewportLeft: number;
    viewportWidth: number;
}

// ============================================================================
// UI COMPONENT PROP TYPES
// ============================================================================

export interface ContentBuilderProps {
    filmId?: number;
    film?: any;
    initialScenes?: TimelineScene[];
    initialTracks?: TimelineTrack[];
    onSave?: (scenes: TimelineScene[], tracks?: TimelineTrack[]) => void;
    onChange?: (scenes: TimelineScene[]) => void;
    onSaveFilmName?: (name: string) => Promise<void>;
    readOnly?: boolean;
    leftPanel?: ReactNode;
    rightPanel?: ReactNode;
    subjectCount?: number;
    /** When set, the film is opened from a package context — schedule filters event days to this package */
    packageId?: number | null;
    /** When set, location slot count in the header is filtered to only this activity */
    linkedActivityId?: number | null;
    equipmentConfig?: {
        cameras: number;
        audio: number;
        music: number;
    };
    equipmentAssignmentsBySlot?: FilmEquipmentAssignmentsBySlot;
    /** Optional FilmContentApi adapter for instance-mode editing (project / inquiry) */
    filmApi?: import('@/components/films/FilmApiContext').FilmContentApi | null;
}

export interface SaveState {
    hasUnsavedChanges: boolean;
    lastSavedAt: Date | null;
    isSaving: boolean;
    saveError: string | null;
}

export interface PlaybackScreenProps {
    currentScene?: TimelineScene | null;
    totalDuration: number;
    currentTime: number;
    readOnly?: boolean;
    className?: string;
    tracks?: TimelineTrack[];
}

export interface CurrentSceneInfo {
    scene: TimelineScene | null;
    mediaComponents: SceneMediaComponent[];
    position: {
        startTime: number;
        endTime: number;
        duration: number;
        trackName?: string;
    };
    metadata: {
        name: string;
        description?: string;
        category?: string;
        complexity?: number;
        tags?: string[];
    };
}

export interface PlaybackScreenData {
    sceneName: string;
    sceneId: number;
    sceneDescription: string;
    mediaCount: number;
    mediaTypes: string[];
    mediaDetails: {
        id: number;
        mediaType?: string;
        fileName: string;
        duration: number;
        trackName?: string;
        trackType?: string;
        isPrimary?: boolean;
    }[];
    sceneStartTime: number;
    sceneEndTime: number;
    sceneDuration: number;
    currentTime: number;
    progress: number;
    isActive: boolean;
    isPlaying: boolean;
    formattedStartTime: string;
    formattedEndTime: string;
    formattedDuration: string;
    formattedCurrentTime: string;
    formattedProgress: string;
}

export interface PlaybackScreenState {
    playbackData: PlaybackScreenData | null;
    hasActiveScene: boolean;
    isEmpty: boolean;
}
