"use client";

import React, { createContext, useContext, ReactNode, useRef } from 'react';
import {
  usePlaybackControls,
  useScenesLibrary,
  useTimelineDragDrop,
  useSaveState,
  useSceneGrouping,
  useKeyboardShortcuts,
  useViewportState,
  useTimelineState,
  useCurrentScene,
  useSceneOperations,
  useSceneDelete,
  useTimelineSave,
  useTimelineStorage,
  useContentBuilderPackageData,
} from '../hooks';
import { TimelineScene, TimelineTrack, DragState, PlaybackState, ViewState } from '@/features/content/content-builder/types/timeline';
import { SceneGroup } from '@/features/content/scenes/types';
import type { FilmEquipmentAssignmentsBySlot } from '@/features/content/films/types/film-equipment.types';
import { scheduleApi, crewSlotsApi } from '@/features/workflow/scheduling/api';
import { useOptionalFilmApi, type FilmContentApi } from '@/features/content/films/components/FilmApiContext';

type PackageSubject = Record<string, unknown>;

export interface TrackDefault {
    subject_ids: number[];
    shot_type: string;
    audio_enabled?: boolean;
}

interface PackageActivity {
  id: number;
  package_event_day_id: number;
}

interface PackageCrewSlotAssignment {
  package_activity_id?: number;
}

interface CrewSlotEquipmentItem {
  equipment_id?: number;
  equipment?: {
    id?: number;
    category?: string;
  };
}

interface PackageCrewSlot {
  id: number;
  package_activity_id?: number;
  event_day_template_id?: number;
  crew_id?: number;
  label?: string;
  job_role?: { id: number; name: string; display_name?: string };
  crew?: { id: number; crew_color?: string };
  equipment?: CrewSlotEquipmentItem[];
  activity_assignments?: PackageCrewSlotAssignment[];
}

interface PackageEventDay {
  id: number;
  _joinId?: number;
}

interface PackageFilmRef {
  id: number;
  film_id: number;
}

interface PackageFilmSchedule {
  scene_schedules?: Array<{
    scene_id: number;
    package_activity_id?: number;
  }>;
}

interface PackageLocation {
  id: number;
  event_day_template_id?: number;
  location_id?: number;
  location_number?: number;
  package_activity_id?: number;
  notes?: string;
  order_index?: number;
  activity_assignments?: Array<{ id: number; package_activity_id: number; package_activity?: { id: number; name: string } }>;
}

interface ContentBuilderContextType {
  // Timeline State
  scenes: TimelineScene[];
  setScenes: (scenes: TimelineScene[] | ((prev: TimelineScene[]) => TimelineScene[])) => void;
  tracks: TimelineTrack[];
  setTracks: (tracks: TimelineTrack[] | ((prev: TimelineTrack[]) => TimelineTrack[])) => void;
  showLibrary: boolean;
  setShowLibrary: (show: boolean) => void;
  showCreateSceneDialog: boolean;
  setShowCreateSceneDialog: (show: boolean) => void;
  
  // Playback
  playbackState: PlaybackState;
  handlePlay: () => void;
  handleStop: () => void;
  handleSpeedChange: (speed: number) => void;
  handleTimelineClick: (time: number) => void;
  jumpToTime: (time: number) => void;
  currentScene: TimelineScene | null;
  currentMoment: any | null;
  
  // Scene Library
  getFilteredScenes: () => unknown[];
  loadAvailableScenes: () => void;
  
  // Save State
  saveState: {
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
  };
  handleSave: () => void;
  
  // Scene Grouping
  sceneGroups: Map<string, SceneGroup>;
  getGroupForScene: (scene: TimelineScene) => SceneGroup | null;
  isSceneInCollapsedGroup: (scene: TimelineScene) => boolean;
  
  // Viewport
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  setViewportWidth: (width: number) => void;
  scrollToTime: (time: number) => void;
  fitToView: (duration: number) => void;
  setZoom: (zoom: number) => void;
  toggleSnap: () => void;
  
  // Drag & Drop
  dragState: DragState;
  handleSceneMouseDown: (e: React.MouseEvent, scene: TimelineScene) => void;

  isSceneCompatibleWithTrack: (sceneType: string, trackType: string) => boolean;
  
  // Scene Operations
  handleSceneDelete: (sceneToDelete: TimelineScene) => void;
  handleReorderScene: (direction: 'left' | 'right', sceneName: string) => void;
  deleteScene: (sceneId: string) => Promise<void>;
  reorderScene: (direction: 'left' | 'right', sceneName: string) => void;
  handleDeleteSceneGroup: (groupId: string) => void;
  handleSceneFromLibrary: (scene: unknown) => void;
  
  // Props
  filmId?: number | string;
  packageId?: number | null;
  readOnly: boolean;
  onSave?: (scenes: TimelineScene[], tracks: TimelineTrack[]) => void;
  timelineRef: React.RefObject<HTMLDivElement>;
  equipmentAssignmentsBySlot?: FilmEquipmentAssignmentsBySlot;
  packageSubjects: PackageSubject[];
  packageActivities: PackageActivity[];
  packageCrewSlots: PackageCrewSlot[];
  /** Pre-computed map: sceneId → { cameraCount, audioCount } based on the scene's linked activity */
  sceneActivityCrewMap: Map<number, { cameraCount: number; audioCount: number }>;
  packageLocations: PackageLocation[];
  packageLocationLookup: Map<string, PackageLocation>;
  /** The activity this film is scoped to (from URL ?activityId=) */
  linkedActivityId?: number | null;
  instanceOwnerType?: 'project' | 'inquiry';
  instanceOwnerId?: number | null;
  /** Per-track defaults: trackId → { subject_ids, shot_type, audio_enabled } */

  trackDefaults: Record<number, TrackDefault>;
  setTrackDefault: (trackId: number, defaults: TrackDefault) => void;
}

const ContentBuilderContext = createContext<ContentBuilderContextType | null>(null);

interface ContentBuilderProviderProps {
  children: ReactNode;
  filmId?: number | string;
  initialScenes?: TimelineScene[];
  initialTracks?: TimelineTrack[];
  onSave?: (scenes: TimelineScene[], tracks: TimelineTrack[]) => void;
  onChange?: (scenes: TimelineScene[]) => void;
  readOnly?: boolean;
  packageId?: number | null;
  linkedActivityId?: number | null;
  instanceOwnerType?: 'project' | 'inquiry';
  instanceOwnerId?: number | null;
  equipmentConfig?: {
    cameras: number;
    audio: number;
    music: number;
  };
  equipmentAssignmentsBySlot?: FilmEquipmentAssignmentsBySlot;
  /** Optional FilmContentApi adapter — when provided (or available from
   *  FilmApiContext), all persistence routes through it. */
  filmApi?: FilmContentApi | null;
}

/**
 * ContentBuilderProvider
 * 
 * Critical component that:
 * 1. Instantiates all hooks ONCE (prevents duplicate state)
 * 2. Provides shared state to all feature containers via context
 * 3. Handles initialization logic (loading tracks, scenes)
 * 
 * This solves the state sharing problem - without this provider,
 * each feature would create its own separate hook instances.
 */
export const ContentBuilderProvider: React.FC<ContentBuilderProviderProps> = ({
  children,
  filmId,
  packageId,
  linkedActivityId,
  instanceOwnerType,
  instanceOwnerId,
  initialScenes,
  initialTracks,
  onSave,
  onChange,
  readOnly = false,
  equipmentAssignmentsBySlot,
  filmApi: filmApiProp,
}) => {
  // Resolve FilmContentApi: prop > context > null (library fallback)
  const filmApiFromContext = useOptionalFilmApi();
  const filmApi = filmApiProp ?? filmApiFromContext ?? null;

  // Timeline ref for drag and drop
  const timelineRef = useRef<HTMLDivElement>(null);

  // Package subjects for subject name resolution across all components
  const {
    packageSubjects,
    packageActivities,
    packageCrewSlots,
    sceneActivityCrewMap,
    packageLocations,
    packageLocationLookup,
  } = useContentBuilderPackageData(packageId, filmId);

  const [trackDefaults, setTrackDefaultsMap] = React.useState<Record<number, TrackDefault>>({});
  const setTrackDefault = React.useCallback((trackId: number, defaults: TrackDefault) => {
    setTrackDefaultsMap(prev => ({ ...prev, [trackId]: defaults }));
  }, []);

  // ✅ INSTANTIATE ALL HOOKS ONCE HERE
  const timelineState = useTimelineState(initialScenes || [], initialTracks || []);
  const playbackControls = usePlaybackControls(timelineState.scenes);
  const scenesLibrary = useScenesLibrary(typeof filmId === 'string' ? parseInt(filmId, 10) : filmId);
  
  // Use timeline storage and save hooks for actual API persistence
  const { saveTimeline, saveTracks } = useTimelineStorage(
    typeof filmId === 'string' ? parseInt(filmId, 10) : (filmId || 0)
  );
  const timelineSave = useTimelineSave(
    typeof filmId === 'string' ? parseInt(filmId, 10) : (filmId || 0),
    saveTimeline,
    saveTracks,
    filmApi,
  );
  
  // Wrap the API save to call both the hook and the prop callback
  const wrappedOnSave = React.useCallback(async (scenes: TimelineScene[]) => {
    await timelineSave.handleSave(scenes, timelineState.tracks);
    
    const idMapping = timelineSave.getIdMapping();
    if (idMapping && idMapping.size > 0) {
      timelineState.setScenes(prevScenes => {
        return prevScenes.map(scene => {
          if (idMapping.has(scene.id)) {
            const databaseId = idMapping.get(scene.id)!;
            return { ...scene, id: databaseId };
          }
          return scene;
        });
      });
    }
    
    if (onSave) {
      onSave(scenes, timelineState.tracks);
    }
  }, [timelineSave, timelineState, onSave]);
  
  const saveStateHook = useSaveState(timelineState.scenes, wrappedOnSave);
  const sceneGrouping = useSceneGrouping(timelineState.scenes);
  const viewport = useViewportState();
  const currentSceneHook = useCurrentScene(
    timelineState.scenes,
    playbackControls.playbackState.currentTime
  );

  // Compute current moment at playback cursor position
  const currentMoment = React.useMemo(() => {
    const scene = currentSceneHook.currentScene;
    if (!scene) return null;
    const originalScene = (scene as any).original_scene || scene;
    const moments = originalScene.moments || [];
    if (moments.length === 0) return null;
    const relativeTime = playbackControls.playbackState.currentTime - (scene.start_time || 0);
    let cumulativeTime = 0;
    for (const m of moments) {
      const momentDuration = m.duration || m.duration_seconds || 0;
      if (relativeTime >= cumulativeTime && relativeTime < cumulativeTime + momentDuration) {
        return m;
      }
      cumulativeTime += momentDuration;
    }
    return moments[moments.length - 1];
  }, [currentSceneHook.currentScene, playbackControls.playbackState.currentTime]);
  
  const dragDrop = useTimelineDragDrop({
    scenes: timelineState.scenes,
    setScenes: timelineState.setScenes,
    tracks: timelineState.tracks,
    zoomLevel: viewport.viewState.zoomLevel,
    gridSize: viewport.viewState.gridSize,
    snapToGrid: viewport.viewState.snapToGrid,
    timelineRef,
  });
  
  const sceneOperations = useSceneOperations({
    scenes: timelineState.scenes,
    setScenes: timelineState.setScenes,
    tracks: timelineState.tracks,
    setTracks: timelineState.setTracks,
    onTimelineUpdated: viewport.zoomToFit,
    onSave: wrappedOnSave,
  });

  // Use the actual delete hook that calls the API
  const sceneDelete = useSceneDelete(
    typeof filmId === 'string' ? parseInt(filmId, 10) : (filmId || 0),
    (sceneId: number) => {
      // Remove from local state after API delete succeeds
      timelineState.setScenes(prev => prev.filter(scene => scene.id !== sceneId));
    },
    filmApi,
  );
  

  // Keyboard shortcuts
  useKeyboardShortcuts(
    readOnly,
    viewport.viewState,
    sceneOperations.handleSceneDelete
  );
  
  // Initialize data on mount
  React.useEffect(() => {
    scenesLibrary.loadAvailableScenes();
  }, [scenesLibrary.loadAvailableScenes]);

  React.useEffect(() => {
    if (onChange) {
      onChange(timelineState.scenes);
    }
  }, [timelineState.scenes, onChange]);
  
  // ✅ SHARE ALL HOOK RESULTS VIA CONTEXT
  const value: ContentBuilderContextType = {
    // Timeline State
    ...timelineState,
    
    // Playback
    ...playbackControls,
    currentScene: currentSceneHook.currentScene,
    currentMoment,
    
    // Scene Library
    ...scenesLibrary,
    
    // Save State
    saveState: {
      ...saveStateHook.saveState,
      lastSaved: null, // Add missing property
    },
    handleSave: saveStateHook.handleSave,
    
    // Scene Grouping
    ...sceneGrouping,
    
    // Viewport
    viewState: viewport.viewState,
    setViewState: viewport.setViewState,
    setViewportWidth: viewport.updateViewportWidth,
    scrollToTime: viewport.scrollToTime,
    fitToView: viewport.zoomToFit,
    setZoom: viewport.setZoomLevel,
    toggleSnap: viewport.toggleSnapToGrid,
    
    // Drag & Drop (scene reordering only, library drag removed)
    dragState: dragDrop.dragState,
    handleSceneMouseDown: dragDrop.handleSceneMouseDown,
    isSceneCompatibleWithTrack: dragDrop.isSceneCompatibleWithTrack,
    
    // Scene Operations - use API delete for actual deletion
    ...sceneOperations,
    deleteScene: async (sceneId: string) => {
      // Parse string ID if needed
      const id = typeof sceneId === 'string' ? parseInt(sceneId, 10) : (sceneId as unknown as number);
      // Get the scene to pass both ID and name to delete
      const scene = timelineState.scenes.find(s => s.id === id);
      if (scene) {
        await sceneDelete.handleDeleteScene(id, scene.name);
      }
    },
    reorderScene: sceneOperations.handleReorderScene,
    
    // Props
    filmId,
    packageId,
    readOnly,
    onSave,
    timelineRef,
    equipmentAssignmentsBySlot,
    packageSubjects,
    packageActivities,
    packageCrewSlots,
    sceneActivityCrewMap,
    packageLocations,
    packageLocationLookup,
    linkedActivityId,
    instanceOwnerType,
    instanceOwnerId,
    trackDefaults,
    setTrackDefault,
  };

  return (
    <ContentBuilderContext.Provider value={value}>
      {children}
    </ContentBuilderContext.Provider>
  );
};

/**
 * useContentBuilder Hook
 * 
 * Custom hook for feature containers to access shared ContentBuilder state.
 * Must be used within ContentBuilderProvider.
 * 
 * Example usage in a feature:
 * ```tsx
 * const { scenes, tracks, handleSceneDelete } = useContentBuilder();
 * ```
 */
export const useContentBuilder = () => {
  const context = useContext(ContentBuilderContext);
  if (!context) {
    throw new Error('useContentBuilder must be used within ContentBuilderProvider');
  }
  return context;
};
