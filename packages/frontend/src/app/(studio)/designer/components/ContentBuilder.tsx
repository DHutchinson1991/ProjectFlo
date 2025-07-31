"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import { DndContext, DragOverlay } from "@dnd-kit/core";

// Import types
import { ContentBuilderProps, TimelineScene } from "./ContentBuilder/types";

// Import hooks
import {
    useTimelineData,
    usePlaybackControls,
    useScenesLibrary,
    useDragAndDrop,
    useSaveState,
    useSceneGrouping,
    useKeyboardShortcuts,
    useContentBuilderDragHandlers,
    useDragSensors,
} from "./ContentBuilder/hooks";

// Import utilities
import { calculateTimelineDuration } from "./ContentBuilder/utils";

// Import modular components
import { PlaybackControls, SaveControls } from "./ContentBuilder/controls";
import { ContentBuilderScenesLibrary, DragOverlayScene } from "./ContentBuilder/library";
import { ContentBuilderTimeline } from "./ContentBuilder/timeline";
import { PlaybackScreen } from "./ContentBuilder/playback";

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

    // Timeline ref for drag and drop
    const timelineRef = useRef<HTMLDivElement>(null);

    // Configure drag sensors
    const sensors = useDragSensors();

    // Use hooks for specific functionality
    const { tracks, loadTimelineLayers } = useTimelineData();
    const {
        playbackState,
        handlePlay,
        handleStop,
        handleSpeedChange,
        handleTimelineClick,
        jumpToTime,
    } = usePlaybackControls(scenes);
    const {
        getFilteredScenes,
        loadAvailableScenes,
    } = useScenesLibrary();

    // Enhanced save state management
    const { saveState, handleSave: performSave } = useSaveState(scenes, onSave);

    // Scene grouping for better visual organization  
    const { sceneGroups, getGroupForScene, isSceneInCollapsedGroup } = useSceneGrouping(scenes);

    // Drag and drop functionality with viewport management
    const {
        dragState,
        viewState,
        setViewState,
        handleSceneMouseDown,
        handleTimelineDragOver,
        handleTimelineDragLeave,
        handleTimelineDrop,
        updateViewportWidth,
        scrollToTime,
        zoomToFit,
        isSceneCompatibleWithTrack,
    } = useDragAndDrop(scenes, setScenes, tracks, timelineRef);

    // Drag handlers for main ContentBuilder component
    const {
        activeDragItem,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
    } = useContentBuilderDragHandlers(scenes, setScenes, tracks, viewState, timelineRef);

    // Handle scene deletion
    const handleSceneDelete = useCallback((sceneToDelete: TimelineScene) => {
        setScenes(prev => prev.filter(scene => scene.id !== sceneToDelete.id));
    }, []);

    // Keyboard shortcuts
    useKeyboardShortcuts(readOnly, viewState, handleSceneDelete);

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

    // Calculate total duration for playback
    const totalDuration = calculateTimelineDuration(scenes);

    // Find current scene based on playback time
    // Modified to collect all scenes at current time and create a composite scene
    const currentScene = React.useMemo(() => {
        const currentTime = playbackState.currentTime;

        // Find all scenes that overlap with the current time
        const activeScenesAtTime = scenes.filter(scene =>
            currentTime >= scene.start_time &&
            currentTime <= scene.start_time + scene.duration
        );

        if (activeScenesAtTime.length === 0) return null;

        // If multiple scenes are active (grouped scenes), create a composite scene
        if (activeScenesAtTime.length > 1) {
            // Find the primary scene (usually VIDEO)
            const primaryScene = activeScenesAtTime.find(s => s.scene_type === 'video') || activeScenesAtTime[0];

            // Create mock media components for all active scene types
            const mockMediaComponents = activeScenesAtTime.map(scene => {
                // Map scene_type to MediaType - handle graphics as video for compatibility
                let mediaType: 'VIDEO' | 'AUDIO' | 'MUSIC';
                switch (scene.scene_type) {
                    case 'audio':
                        mediaType = 'AUDIO';
                        break;
                    case 'music':
                        mediaType = 'MUSIC';
                        break;
                    case 'video':
                    case 'graphics':
                    default:
                        mediaType = 'VIDEO';
                        break;
                }

                return {
                    id: scene.id,
                    media_type: mediaType,
                    track_id: scene.track_id,
                    start_time: scene.start_time,
                    duration: scene.duration,
                    is_primary: scene.scene_type === 'video',
                    music_type: undefined,
                    notes: undefined,
                    scene_component_id: scene.id
                };
            });

            // Return the primary scene but with all media components from active scenes
            return {
                ...primaryScene,
                name: primaryScene.name.replace(/ - (VIDEO|AUDIO|MUSIC|GRAPHICS)$/, ''), // Clean up name
                media_components: mockMediaComponents
            };
        }

        // Single scene - return as is, but convert it to have proper media_components
        const singleScene = activeScenesAtTime[0];

        // If the scene doesn't have media_components, create one based on its scene_type
        if (!singleScene.media_components || singleScene.media_components.length === 0) {
            let mediaType: 'VIDEO' | 'AUDIO' | 'MUSIC';
            switch (singleScene.scene_type) {
                case 'audio':
                    mediaType = 'AUDIO';
                    break;
                case 'music':
                    mediaType = 'MUSIC';
                    break;
                case 'video':
                case 'graphics':
                default:
                    mediaType = 'VIDEO';
                    break;
            }

            return {
                ...singleScene,
                media_components: [{
                    id: singleScene.id,
                    media_type: mediaType,
                    track_id: singleScene.track_id,
                    start_time: singleScene.start_time,
                    duration: singleScene.duration,
                    is_primary: true,
                    music_type: undefined,
                    notes: undefined,
                    scene_component_id: singleScene.id
                }]
            };
        }

        return singleScene;
    }, [scenes, playbackState.currentTime]);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <Box
                sx={{
                    width: "82vw",
                    maxWidth: "100vw",
                    display: "flex",
                    flexDirection: "row", // Horizontal layout: main area + sidebar
                    position: "relative",
                    backgroundColor: "#000",
                    color: "#fff",
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
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
                {/* Main 3-Column Layout */}
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0,
                    overflow: "visible"
                }}>
                    {/* Top Row - 3 Column Layout: Scenes Library | Player/Controls | Film Details */}
                    <Box sx={{
                        display: "flex",
                        width: "100%",
                        minHeight: "400px",
                        maxHeight: "calc(100vh - 200px)", // Leave room for timeline
                        overflow: "hidden",
                        boxSizing: "border-box",
                        gap: 0, // No gap to save space
                        // Responsive behavior for smaller screens
                        '@media (max-width: 1200px)': {
                            flexDirection: 'column',
                            maxHeight: 'none'
                        }
                    }}>
                        {/* Left Column - Scenes Library (20% width) */}
                        <Box sx={{
                            width: "20%", // Percentage-based width
                            minWidth: "220px", // Minimum for usability
                            maxWidth: "300px", // Maximum to prevent too wide
                            borderRight: "1px solid #333",
                            background: "#1a1a1a",
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            overflow: "hidden",
                            flexShrink: 0, // Prevent shrinking
                            // Responsive behavior
                            '@media (max-width: 1200px)': {
                                width: '100%',
                                maxWidth: '100%',
                                height: '200px',
                                borderRight: 'none',
                                borderBottom: '1px solid #333'
                            }
                        }}>
                            <ContentBuilderScenesLibrary
                                scenes={getFilteredScenes()}
                                readOnly={readOnly}
                            />
                        </Box>

                        {/* Center Column - PlaybackScreen and Controls (60% width) */}
                        <Box sx={{
                            flex: 1, // Allow this column to grow and shrink to fill available space
                            minWidth: "320px", // Ensure minimum space for 16:9 player
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            overflow: "hidden",
                            // Responsive behavior
                            '@media (max-width: 1200px)': {
                                width: '100%',
                                minWidth: '300px'
                            }
                        }}>
                            {/* PlaybackScreen Container - 16:9 Aspect Ratio */}
                            <Box sx={{
                                flex: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: "#0a0a0a",
                                borderBottom: "1px solid #333",
                                padding: "8px", // Minimal padding
                                minHeight: 0,
                                overflow: "hidden"
                            }}>
                                {/* 16:9 Aspect Ratio Container - Dynamically sizes to fit available space */}
                                <Box sx={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    aspectRatio: "16/9",
                                    height: "auto",
                                    maxHeight: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    position: "relative",
                                    backgroundColor: "#000",
                                    "& > *": {
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain"
                                    }
                                }}>
                                    <PlaybackScreen
                                        currentScene={currentScene}
                                        totalDuration={totalDuration}
                                        currentTime={playbackState.currentTime}
                                        readOnly={readOnly}
                                        tracks={tracks}
                                    />
                                </Box>
                            </Box>

                            {/* Unified Controls Panel - Darker Timeline-Consistent Design */}
                            <Box sx={{
                                padding: "6px 16px",
                                borderBottom: "1px solid #2a2a2a",
                                backgroundColor: "#0f0f0f", // Much darker to match timeline
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                minHeight: "44px", // Slightly smaller
                                maxHeight: "44px",
                                flexShrink: 0,
                                overflow: "visible",
                                width: "100%",
                                background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)", // Darker gradient
                                borderTop: "1px solid rgba(255, 255, 255, 0.02)", // More subtle
                                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.01), 0 1px 2px rgba(0, 0, 0, 0.4)", // Darker shadow
                            }}>
                                {/* Left Spacer - keeps playback controls centered */}
                                <Box sx={{ flex: 1 }} />

                                {/* Center - Playback Controls */}
                                <Box sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    px: 2,
                                    py: 0.5,
                                    bgcolor: "rgba(0, 0, 0, 0.4)", // Darker background
                                    borderRadius: 1.5,
                                    border: "1px solid rgba(255, 255, 255, 0.05)", // More subtle border
                                    backdropFilter: "blur(8px)",
                                    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.02)" // Darker shadow
                                }}>
                                    <PlaybackControls
                                        playbackState={{
                                            ...playbackState,
                                            totalDuration,
                                        }}
                                        onPlay={handlePlay}
                                        onPause={handlePlay}
                                        onStop={handleStop}
                                        onSeek={jumpToTime}
                                        onSpeedChange={handleSpeedChange}
                                        readOnly={readOnly}
                                    />
                                </Box>

                                {/* Right - Compact Save Controls */}
                                <Box sx={{
                                    flex: 1,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "center"
                                }}>
                                    <SaveControls
                                        saveState={saveState}
                                        onSave={handleSave}
                                        readOnly={readOnly}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Right Column - Film Details (20% width) */}
                        <Box sx={{
                            width: "20%", // Percentage-based width
                            minWidth: "200px", // Minimum for film details
                            maxWidth: "280px", // Maximum to prevent too wide
                            borderLeft: "1px solid #333",
                            background: "#151515",
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            padding: "12px", // Comfortable padding
                            flexShrink: 0, // Prevent shrinking
                            overflow: "hidden",
                            // Responsive behavior
                            '@media (max-width: 1200px)': {
                                width: '100%',
                                maxWidth: '100%',
                                borderLeft: 'none',
                                borderTop: '1px solid #333'
                            }
                        }}>
                            {/* Film Details Placeholder */}
                            <Box sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                height: "100%"
                            }}>
                                {/* Header */}
                                <Box sx={{
                                    borderBottom: "1px solid #333",
                                    paddingBottom: 1,
                                    marginBottom: 1
                                }}>
                                    <Box sx={{
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: "#fff",
                                        marginBottom: 0.5
                                    }}>
                                        Film Details
                                    </Box>
                                    <Box sx={{
                                        fontSize: "12px",
                                        color: "rgba(255, 255, 255, 0.7)"
                                    }}>
                                        Project information and metadata
                                    </Box>
                                </Box>

                                {/* Film Info Sections */}
                                <Box sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                    flex: 1,
                                    overflow: "auto"
                                }}>
                                    {/* Project Info */}
                                    <Box>
                                        <Box sx={{
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            color: "rgba(255, 255, 255, 0.9)",
                                            marginBottom: 0.5
                                        }}>
                                            Project
                                        </Box>
                                        <Box sx={{
                                            fontSize: "11px",
                                            color: "rgba(255, 255, 255, 0.6)",
                                            padding: "4px 8px",
                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                            borderRadius: 1,
                                            border: "1px solid rgba(255, 255, 255, 0.1)"
                                        }}>
                                            Untitled Project
                                        </Box>
                                    </Box>

                                    {/* Duration */}
                                    <Box>
                                        <Box sx={{
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            color: "rgba(255, 255, 255, 0.9)",
                                            marginBottom: 0.5
                                        }}>
                                            Duration
                                        </Box>
                                        <Box sx={{
                                            fontSize: "11px",
                                            color: "rgba(255, 255, 255, 0.6)",
                                            padding: "4px 8px",
                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                            borderRadius: 1,
                                            border: "1px solid rgba(255, 255, 255, 0.1)"
                                        }}>
                                            {Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, '0')}
                                        </Box>
                                    </Box>

                                    {/* Scene Count */}
                                    <Box>
                                        <Box sx={{
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            color: "rgba(255, 255, 255, 0.9)",
                                            marginBottom: 0.5
                                        }}>
                                            Scenes
                                        </Box>
                                        <Box sx={{
                                            fontSize: "11px",
                                            color: "rgba(255, 255, 255, 0.6)",
                                            padding: "4px 8px",
                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                            borderRadius: 1,
                                            border: "1px solid rgba(255, 255, 255, 0.1)"
                                        }}>
                                            {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
                                        </Box>
                                    </Box>

                                    {/* Additional film details can go here */}
                                    <Box sx={{
                                        marginTop: "auto",
                                        padding: "8px",
                                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                                        borderRadius: 1,
                                        border: "1px solid rgba(255, 255, 255, 0.05)",
                                        fontSize: "11px",
                                        color: "rgba(255, 255, 255, 0.5)",
                                        textAlign: "center"
                                    }}>
                                        More details coming soon...
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Bottom Row - Timeline Spanning All Columns */}
                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#111",
                        borderTop: "1px solid #333",
                        minHeight: "300px"
                    }}>
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
                            onZoomChange={(zoom: number) => setViewState({ ...viewState, zoomLevel: zoom })}
                            onSnapToggle={() => setViewState({ ...viewState, snapToGrid: !viewState.snapToGrid })}
                            onFitToView={() => zoomToFit(totalDuration)}
                            onTimelineClick={handleTimelineClick}
                            scrollToTime={scrollToTime}
                        />
                    </Box>
                </Box>
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
