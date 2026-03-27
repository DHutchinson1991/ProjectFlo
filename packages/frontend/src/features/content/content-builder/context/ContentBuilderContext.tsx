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

interface PackageOperatorAssignment {
  package_activity_id?: number;
}

interface OperatorEquipmentItem {
  equipment_id?: number;
  equipment?: {
    id?: number;
    category?: string;
  };
}

interface PackageOperator {
  id: number;
  package_activity_id?: number;
  event_day_template_id?: number;
  crew_member_id?: number;
  label?: string;
  job_role?: { id: number; name: string; display_name?: string };
  crew_member?: { id: number; crew_color?: string };
  equipment?: OperatorEquipmentItem[];
  activity_assignments?: PackageOperatorAssignment[];
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
  packageOperators: PackageOperator[];
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
  const [packageSubjects, setPackageSubjects] = React.useState<PackageSubject[]>([]);
  React.useEffect(() => {
    if (!packageId) return;
    let mounted = true;
    scheduleApi.packageEventDaySubjects.getAll(packageId).then((subjects) => {
      if (mounted) setPackageSubjects((subjects || []) as PackageSubject[]);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [packageId]);

  const [trackDefaults, setTrackDefaultsMap] = React.useState<Record<number, TrackDefault>>({});
  const setTrackDefault = React.useCallback((trackId: number, defaults: TrackDefault) => {
    setTrackDefaultsMap(prev => ({ ...prev, [trackId]: defaults }));
  }, []);

  const [packageLocations, setPackageLocations] = React.useState<PackageLocation[]>([]);
  const [packageLocationLookup, setPackageLocationLookup] = React.useState<Map<string, PackageLocation>>(new Map());

  React.useEffect(() => {
    if (!packageId) return;
    let mounted = true;
    // Use the numbered slot system (packageLocationSlots), which is what the
    // package designer populates. Filter only slots with activity assignments.
    scheduleApi.packageLocationSlots.getAll(packageId).then((slots) => {
      if (!mounted) return;
      const assigned = ((slots || []) as PackageLocation[]).filter(
        (s) => (s.activity_assignments?.length || 0) > 0
      );
      setPackageLocations(assigned);
      const lookup = new Map<string, PackageLocation>();
      assigned.forEach((loc) => { lookup.set(String(loc.id), loc); });
      setPackageLocationLookup(lookup);
    }).catch(() => {
      if (!mounted) return;
      setPackageLocations([]);
      setPackageLocationLookup(new Map());
    });
    return () => { mounted = false; };
  }, [packageId]);

  // Package activities, operators, and scene→crew map for activity-aware track filtering
  const [packageActivities, setPackageActivities] = React.useState<PackageActivity[]>([]);
  const [packageOperators, setPackageOperators] = React.useState<PackageOperator[]>([]);
  const [sceneActivityCrewMap, setSceneActivityCrewMap] = React.useState<Map<number, { cameraCount: number; audioCount: number }>>(new Map());

  React.useEffect(() => {
    if (!packageId || !filmId) return;
    let mounted = true;

    (async () => {
      try {
        const [activities, operators, packageFilms, eventDays] = await Promise.all([
          scheduleApi.packageActivities.getAll(packageId),
          crewSlotsApi.packageDay.getAll(packageId),
          scheduleApi.packageFilms.getAll(packageId),
          scheduleApi.packageEventDays.getAll(packageId),
        ]);
        if (!mounted) return;

        setPackageActivities((activities || []) as PackageActivity[]);
        setPackageOperators((operators || []) as PackageOperator[]);

        // Build mapping from PackageEventDay join-table ID → actual EventDay ID
        const joinToTemplateMap = new Map<number, number>();
        ((eventDays || []) as PackageEventDay[]).forEach((d) => {
          if (d._joinId != null) joinToTemplateMap.set(d._joinId, d.id);
        });

        // Find the PackageFilm entry for this film
        const numFilmId = typeof filmId === 'string' ? parseInt(filmId, 10) : filmId;
        const matchingPF = ((packageFilms || []) as PackageFilmRef[]).find((pf) => pf.film_id === numFilmId);
        if (!matchingPF) return;

        const pfData = (await scheduleApi.packageFilms.getSchedule(matchingPF.id)) as PackageFilmSchedule;
        if (!mounted || !pfData?.scene_schedules) return;

        // Pre-compute crew counts per activity
        const activityCrewCounts = new Map<number, { cameraCount: number; audioCount: number }>();
        ((activities || []) as PackageActivity[]).forEach((act) => {
          // Resolve the actual template ID (operators use event_day_template_id which is the EventDay.id)
          const activityEventDayId = joinToTemplateMap.get(act.package_event_day_id) ?? act.package_event_day_id;
          // Same 3-condition inheritance filter as MomentEditor
          const matched = ((operators || []) as PackageOperator[]).filter((o) => {
            if (o.package_activity_id === act.id) return true;
            if (o.activity_assignments?.some((a) => a.package_activity_id === act.id)) return true;
            const hasNoAssignment = !o.package_activity_id && (!o.activity_assignments || o.activity_assignments.length === 0);
            if (hasNoAssignment && o.event_day_template_id === activityEventDayId) return true;
            return false;
          });
          // Deduplicate by crew_member_id
          const seen = new Map<number, PackageOperator>();
          matched.forEach((o) => {
            const crewId = o.crew_member_id ?? o.id;
            if (!seen.has(crewId)) seen.set(crewId, o);
          });
          const crew = Array.from(seen.values());

          const cameraIds = new Set<number>();
          const audioIds = new Set<number>();
          crew.forEach((op) => {
            const equipment = (op.equipment && op.equipment.length > 0
              ? op.equipment
              : []) ?? [];
            equipment.forEach((eq) => {
              const cat = (eq.equipment?.category || '').toUpperCase();
              const eqId = eq.equipment_id ?? eq.equipment?.id;
              if (cat === 'CAMERA' && eqId) cameraIds.add(eqId);
              if (cat === 'AUDIO' && eqId) audioIds.add(eqId);
            });
          });
          activityCrewCounts.set(act.id, { cameraCount: cameraIds.size, audioCount: audioIds.size });
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
    saveTracks,
    filmApi,
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
    packageOperators,
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
