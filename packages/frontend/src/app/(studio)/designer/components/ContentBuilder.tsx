"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

// Import types
import { ContentBuilderProps, TimelineScene, ScenesLibrary } from "./ContentBuilder/types";

// Import hooks
import {
    useTimelineData,
    usePlaybackControls,
    useScenesLibrary,
    useDragAndDrop,
    useSaveState,
    useSceneGrouping,
} from "./ContentBuilder/hooks";

// Import utilities
import {
    findAvailableSpaceOnTrack,
    createTimelineScenesFromLibraryScene,
    calculateTimelineDuration
} from "./ContentBuilder/utils";

// Import modular components
import { ContentBuilderControls } from "./ContentBuilder/controls";
import { ContentBuilderScenesLibrary, DragOverlayScene } from "./ContentBuilder/library";
import { ContentBuilderTimeline } from "./ContentBuilder/timeline";

/**
 * Main ContentBuilder component - orchestrates the modular content building experience
 * 
 * Modular Architecture:
 * - types/: All TypeScript interfaces and types (sceneTypes, timelineTypes, etc.)
 * - hooks/: Custom hooks for data management and business logic
 * - controls/: Playback, timeline, save, and view controls
 * - library/: Drag-and-drop scenes library and scene management
 * - timeline/: Timeline view, tracks, playhead, and drop zones
 * - utils/: Utility functions for scenes, timeline, colors, and formatting
 */
const ContentBuilder: React.FC<ContentBuilderProps> = ({
    initialScenes = [],
    onSave,
    readOnly = false,
}) => {
    // Local state for scenes (since hooks don't provide this)
    const [scenes, setScenes] = useState<TimelineScene[]>(initialScenes);

    // Drag and drop state
    const [activeDragItem, setActiveDragItem] = useState<{
        scene: ScenesLibrary | TimelineScene;
        isFromLibrary: boolean;
    } | null>(null);

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Use hooks for specific functionality
    const { tracks, loadTimelineLayers } = useTimelineData();
    const {
        playbackState,
        handlePlay,
        handleStop,
        handleSpeedChange,
        handleTimelineClick: updatePlaybackTime,
        jumpToTime,
    } = usePlaybackControls(scenes);
    const {
        libraryState,
        loadAvailableScenes,
        getFilteredScenes,
        updateSearchTerm,
        updateSelectedCategory,
    } = useScenesLibrary();

    // Enhanced save state management
    const { saveState, handleSave: performSave } = useSaveState(scenes, onSave);

    // Scene grouping for better visual organization  
    const { sceneGroups, getGroupForScene, isSceneInCollapsedGroup } = useSceneGrouping(scenes);

    // Timeline ref for drag and drop
    const timelineRef = useRef<HTMLDivElement>(null);

    // Drag and drop functionality with viewport management
    const {
        dragState,
        viewState,
        setViewState,
        handleSceneMouseDown,
        handleLibrarySceneDragStart,
        handleTimelineDragOver,
        handleTimelineDragLeave,
        handleTimelineDrop,
        handleLibrarySceneDragEnd,
        updateViewportWidth,
        zoomToFit,
        isSceneCompatibleWithTrack,
    } = useDragAndDrop(scenes, setScenes, tracks, timelineRef);

    // Initialize data on mount
    useEffect(() => {
        loadTimelineLayers();
        loadAvailableScenes();
    }, []); // Empty dependency array since functions are now memoized

    // Update scenes when initialScenes change
    useEffect(() => {
        if (initialScenes.length > 0) {
            setScenes(initialScenes);
        }
    }, [initialScenes]);

    // Handle save - now uses enhanced save state management
    const handleSave = useCallback(() => {
        performSave();
    }, [performSave]);

    // Handle scene deletion
    const handleSceneDelete = useCallback((sceneToDelete: TimelineScene) => {
        setScenes(prev => prev.filter(scene => scene.id !== sceneToDelete.id));
    }, []);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle keyboard shortcuts if not in read-only mode
            if (readOnly) return;

            // Handle Delete key for selected scene
            if (event.key === 'Delete' || event.key === 'Backspace') {
                const selectedScene = viewState.selectedScene;
                if (selectedScene) {
                    event.preventDefault();
                    handleSceneDelete(selectedScene);
                }
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [readOnly, viewState.selectedScene, handleSceneDelete]);

    // Calculate total duration for playback
    const totalDuration = calculateTimelineDuration(scenes);

    // Drag event handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        // Check if it's a library scene (from data transfer) or timeline scene
        if (active.data.current?.type === 'library-scene') {
            const scene = active.data.current.scene as ScenesLibrary;
            setActiveDragItem({ scene, isFromLibrary: true });
        } else if (active.data.current?.type === 'timeline-scene') {
            const scene = active.data.current.scene as TimelineScene;
            setActiveDragItem({ scene, isFromLibrary: false });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.data.current && over.data.current) {
            // Handle dropping on timeline tracks
            if (over.data.current.type === 'timeline-track') {
                const trackId = over.data.current.trackId as number;

                // Calculate drop position based on mouse coordinates
                // We need to get the mouse position relative to the timeline
                const timelineElement = timelineRef.current;
                if (!timelineElement) return;

                const timelineRect = timelineElement.getBoundingClientRect();
                const activatorEvent = event.activatorEvent as MouseEvent | PointerEvent;
                const mouseX = activatorEvent?.clientX || 0;
                const relativeX = mouseX - timelineRect.left + viewState.viewportLeft;
                const dropPosition = { x: relativeX, y: 0 };

                if (active.data.current.type === 'library-scene') {
                    // Adding new scene from library
                    const libraryScene = active.data.current.scene as ScenesLibrary;
                    handleLibrarySceneDrop(libraryScene, trackId, dropPosition);
                } else if (active.data.current.type === 'timeline-scene') {
                    // Moving existing scene
                    const timelineScene = active.data.current.scene as TimelineScene;
                    handleTimelineSceneMove(timelineScene, trackId, dropPosition);
                }
            }
        }

        setActiveDragItem(null);
    };

    const handleDragOver = () => {
        // This can be used for real-time visual feedback
        // For now, we'll keep the existing logic in the timeline component
    };

    // Helper functions for drag operations
    const handleLibrarySceneDrop = (scene: ScenesLibrary, trackId: number, position: { x: number; y: number }) => {
        const preferredStartTime = Math.max(0, position.x / viewState.zoomLevel);

        // Use centralized utility to create timeline scenes from library scene
        const newScenes = createTimelineScenesFromLibraryScene(
            scene,
            tracks,
            preferredStartTime,
            scenes
        );

        // Add all new scenes
        if (newScenes.length > 0) {
            setScenes(prev => [...prev, ...newScenes]);
        }
    };

    const handleTimelineSceneMove = (scene: TimelineScene, trackId: number, position: { x: number; y: number }) => {
        const preferredStartTime = Math.max(0, position.x / viewState.zoomLevel);

        // Use centralized utility to find the best available spot, excluding the scene being moved
        const bestStartTime = findAvailableSpaceOnTrack(
            scenes,
            trackId,
            preferredStartTime,
            scene.duration,
            scene.id // Exclude the scene being moved from collision detection
        );

        setScenes(prev => prev.map(s =>
            s.id === scene.id
                ? { ...s, start_time: bestStartTime, track_id: trackId }
                : s
        ));
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <Box
                sx={{
                    height: "100vh",
                    width: "100%",
                    maxWidth: "100vw",
                    display: "grid",
                    gridTemplateRows: "auto auto 1fr",
                    gridTemplateColumns: "1fr",


                    position: "relative",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    minHeight: "100vh",
                    minWidth: 0, // Prevent flex item overflow
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,

                        pointerEvents: "none",
                        zIndex: 0,
                    },
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.005) 0%, transparent 70%)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }
                }}
            >
                {/* Top Controls - Clean, Unstyled Container */}
                <ContentBuilderControls
                    playbackState={{
                        ...playbackState,
                        totalDuration,
                    }}
                    viewState={viewState}
                    saveState={saveState}
                    onPlay={handlePlay}
                    onPause={handlePlay} // handlePlay is a toggle function
                    onStop={handleStop}
                    onSeek={updatePlaybackTime}
                    onSpeedChange={handleSpeedChange}
                    onZoomChange={(zoom: number) => setViewState({ ...viewState, zoomLevel: zoom })}
                    onSnapToggle={() => setViewState({ ...viewState, snapToGrid: !viewState.snapToGrid })}
                    onFitToView={() => zoomToFit(totalDuration)}
                    onSave={handleSave}
                    viewMode="grid"
                    onViewModeChange={() => { }}
                    readOnly={readOnly}
                />

                {/* Timeline Container - Self-styled */}
                <ContentBuilderTimeline
                    scenes={scenes}
                    tracks={tracks}
                    playbackState={{
                        ...playbackState,
                        totalDuration,
                    }}
                    viewState={viewState}
                    dragState={dragState}
                    timelineRef={timelineRef}
                    onSceneMouseDown={handleSceneMouseDown}
                    onSceneDelete={handleSceneDelete}
                    onTimelineDragOver={handleTimelineDragOver}
                    onTimelineDragLeave={handleTimelineDragLeave}
                    onTimelineDrop={handleTimelineDrop}
                    onViewportWidthChange={updateViewportWidth}
                    isSceneCompatibleWithTrack={isSceneCompatibleWithTrack}
                    readOnly={readOnly}
                    sceneGroups={sceneGroups}
                    getGroupForScene={getGroupForScene}
                    isSceneInCollapsedGroup={isSceneInCollapsedGroup}
                />

                {/* Scenes Library Container - Self-styled */}
                <ContentBuilderScenesLibrary
                    scenes={getFilteredScenes()}
                    readOnly={readOnly}
                />
            </Box>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeDragItem ? (
                    <DragOverlayScene
                        scene={activeDragItem.scene}
                        isFromLibrary={activeDragItem.isFromLibrary}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default ContentBuilder;
