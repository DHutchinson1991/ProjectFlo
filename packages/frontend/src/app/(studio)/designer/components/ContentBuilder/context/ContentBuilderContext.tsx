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
} from '@/hooks/content-builder';
import { TimelineScene, TimelineTrack, DragState, PlaybackState, ViewState } from '@/lib/types/timeline';
import { ScenesLibrary } from '@/lib/types/domains/scenes';
import type { FilmEquipmentAssignmentsBySlot } from '@/types/film-equipment.types';
import { api } from '@/lib/api';

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
  sceneGroups: Map<string, unknown>;
  getGroupForScene: (scene: TimelineScene) => unknown;
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
  handleSceneDelete: (sceneId: string) => void;
  handleReorderScene: (direction: 'left' | 'right', sceneName: string) => void;
  deleteScene: (sceneId: string) => void;
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
  packageSubjects: any[];
  packageActivities: any[];
  packageOperators: any[];
  /** Pre-computed map: sceneId → { cameraCount, audioCount } based on the scene's linked activity */
  sceneActivityCrewMap: Map<number, { cameraCount: number; audioCount: number }>;
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
  equipmentConfig?: {
    cameras: number;
    audio: number;
    music: number;
  };
  equipmentAssignmentsBySlot?: FilmEquipmentAssignmentsBySlot;
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
  initialScenes,
  initialTracks,
  onSave,
  onChange,
  readOnly = false,
  equipmentConfig,
  equipmentAssignmentsBySlot,
}) => {
  // Timeline ref for drag and drop
  const timelineRef = useRef<HTMLDivElement>(null);

  // Package subjects for subject name resolution across all components
  const [packageSubjects, setPackageSubjects] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (!packageId) return;
    let mounted = true;
    api.schedule.packageEventDaySubjects.getAll(packageId).then((subjects) => {
      if (mounted) setPackageSubjects(subjects || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [packageId]);

  // Package activities, operators, and scene→crew map for activity-aware track filtering
  const [packageActivities, setPackageActivities] = React.useState<any[]>([]);
  const [packageOperators, setPackageOperators] = React.useState<any[]>([]);
  const [sceneActivityCrewMap, setSceneActivityCrewMap] = React.useState<Map<number, { cameraCount: number; audioCount: number }>>(new Map());

  React.useEffect(() => {
    if (!packageId || !filmId) return;
    let mounted = true;

    (async () => {
      try {
        const [activities, operators, packageFilms, eventDays] = await Promise.all([
          api.schedule.packageActivities.getAll(packageId),
          api.operators.packageDay.getAll(packageId),
          api.schedule.packageFilms.getAll(packageId),
          api.schedule.packageEventDays.getAll(packageId),
        ]);
        if (!mounted) return;

        setPackageActivities(activities || []);
        setPackageOperators(operators || []);

        // Build mapping from PackageEventDay join-table ID → actual EventDayTemplate ID
        const joinToTemplateMap = new Map<number, number>();
        (eventDays || []).forEach((d: any) => {
          if (d._joinId != null) joinToTemplateMap.set(d._joinId, d.id);
        });

        // Find the PackageFilm entry for this film
        const numFilmId = typeof filmId === 'string' ? parseInt(filmId, 10) : filmId;
        const matchingPF = (packageFilms || []).find((pf: any) => pf.film_id === numFilmId);
        if (!matchingPF) return;

        const pfData = await api.schedule.packageFilms.getSchedule(matchingPF.id);
        if (!mounted || !pfData?.scene_schedules) return;

        // Pre-compute crew counts per activity
        const activityCrewCounts = new Map<number, { cameraCount: number; audioCount: number }>();
        (activities || []).forEach((act: any) => {
          // Resolve the actual template ID (operators use event_day_template_id which is the EventDayTemplate.id)
          const activityEventDayId = joinToTemplateMap.get(act.package_event_day_id) ?? act.package_event_day_id;
          // Same 3-condition inheritance filter as MomentEditor
          const matched = (operators || []).filter((o: any) => {
            if (o.package_activity_id === act.id) return true;
            if (o.activity_assignments?.some((a: any) => a.package_activity_id === act.id)) return true;
            const hasNoAssignment = !o.package_activity_id && (!o.activity_assignments || o.activity_assignments.length === 0);
            if (hasNoAssignment && o.event_day_template_id === activityEventDayId) return true;
            return false;
          });
          // Deduplicate by operator_template_id
          const seen = new Map<number, any>();
          matched.forEach((o: any) => {
            const templateId = o.operator_template_id ?? o.operator_template?.id ?? o.id;
            if (!seen.has(templateId)) seen.set(templateId, o);
          });
          const crew = Array.from(seen.values());

          let cameraCount = 0;
          const audioIds = new Set<number>();
          crew.forEach((op: any) => {
            const equipment = op.equipment?.length > 0
              ? op.equipment
              : op.operator_template?.default_equipment || [];
            let hasCamera = false;
            equipment.forEach((eq: any) => {
              const cat = (eq.equipment?.category || '').toUpperCase();
              const eqId = eq.equipment_id ?? eq.equipment?.id;
              if (cat === 'CAMERA' && !hasCamera) hasCamera = true;
              if (cat === 'AUDIO' && eqId) audioIds.add(eqId);
            });
            if (hasCamera) cameraCount++;
          });
          activityCrewCounts.set(act.id, { cameraCount, audioCount: audioIds.size });
        });

        // Map scene → crew counts via schedule's package_activity_id
        const sceneCrewMap = new Map<number, { cameraCount: number; audioCount: number }>();
        for (const sched of pfData.scene_schedules) {
          if (sched.package_activity_id) {
            const crew = activityCrewCounts.get(sched.package_activity_id);
            if (crew) sceneCrewMap.set(sched.scene_id, crew);
          }
        }
        setSceneActivityCrewMap(sceneCrewMap);
      } catch {
        // silently fail - timeline will show default behavior
      }
    })();

    return () => { mounted = false; };
  }, [packageId, filmId]);

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
    saveTracks
  );
  
  // Wrap the API save to call both the hook and the prop callback
  const wrappedOnSave = React.useCallback(async (scenes: TimelineScene[]) => {
    console.log('💾 [CONTEXT] Starting save operation...');
    // Call the API save hook which handles database persistence
    await timelineSave.handleSave(scenes, timelineState.tracks);
    
    // Get the ID mapping from the save operation to update scene IDs if needed
    const idMapping = timelineSave.getIdMapping();
    if (idMapping && idMapping.size > 0) {
      console.log('💾 [CONTEXT] Applying ID mapping to scenes:', Array.from(idMapping.entries()));
      // Update scenes with database IDs and mark as no longer new
      // Use functional update to get latest state and avoid stale closures
      timelineState.setScenes(prevScenes => {
        return prevScenes.map(scene => {
          if (idMapping.has(scene.id)) {
            const databaseId = idMapping.get(scene.id)!;
            console.log(`💾 [CONTEXT] Updating scene ID: ${scene.id} → ${databaseId}`);
            // Return updated scene with new ID and remove temp ID markers
            return { ...scene, id: databaseId };
          }
          return scene;
        });
      });
    }
    
    // Call the prop callback if provided (for backwards compatibility)
    if (onSave) {
      onSave(scenes, timelineState.tracks);
    }
    console.log('✅ [CONTEXT] Save operation complete');
  }, [timelineSave, timelineState, onSave]);
  
  const saveStateHook = useSaveState(timelineState.scenes, wrappedOnSave);
  const sceneGrouping = useSceneGrouping(timelineState.scenes);
  const viewport = useViewportState();
  const currentSceneHook = useCurrentScene(
    timelineState.scenes,
    playbackControls.playbackState.currentTime
  );
  
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
    }
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
  
  // ✅ SHARE ALL HOOK RESULTS VIA CONTEXT
  const value: ContentBuilderContextType = {
    // Timeline State
    ...timelineState,
    
    // Playback
    ...playbackControls,
    currentScene: currentSceneHook.currentScene,
    
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
    packageOperators,
    sceneActivityCrewMap,
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
