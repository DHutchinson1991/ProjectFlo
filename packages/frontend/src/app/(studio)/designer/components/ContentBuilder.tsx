"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";

// Import types
import { ContentBuilderProps, TimelineScene } from "./ContentBuilderTypes";

// Import hooks
import {
  useTimelineData,
  usePlaybackControls,
  useScenesLibrary,
  useDragAndDrop,
} from "./ContentBuilderHooks";

// Import modular components
import ContentBuilderControls from "./ContentBuilderControls";
import ContentBuilderScenesLibrary from "./ContentBuilderScenesLibrary";
import ContentBuilderTimeline from "./ContentBuilderTimeline";
import ContentBuilderExportDialog from "./ContentBuilderExportDialog";

/**
 * Main ContentBuilder component - orchestrates the modular content building experience
 * This component has been refactored from a 2000+ line file into focused modules:
 * - ContentBuilderTypes.ts: All TypeScript interfaces and types
 * - ContentBuilderHooks.ts: Custom hooks for data management and business logic
 * - ContentBuilderControls.tsx: Playback, zoom, and action controls
 * - ContentBuilderScenesLibrary.tsx: Drag-and-drop scenes library
 * - ContentBuilderTimeline.tsx: Main timeline view with tracks and scenes
 * - ContentBuilderExportDialog.tsx: Export functionality dialog
 */
const ContentBuilder: React.FC<ContentBuilderProps> = ({
  initialScenes = [],
  onSave,
  onExport,
  readOnly = false,
}) => {
  // Local state for scenes (since hooks don't provide this)
  const [scenes, setScenes] = useState<TimelineScene[]>(initialScenes);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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

  // Handle save
  const handleSave = useCallback(() => {
    onSave?.(scenes);
  }, [onSave, scenes]);

  // Handle export
  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleExportConfirm = useCallback(
    (format: string) => {
      onExport?.(format);
      setExportDialogOpen(false);
    },
    [onExport],
  );

  // Calculate total duration for playback
  const totalDuration = scenes.reduce((max, scene) => {
    return Math.max(max, scene.start_time + scene.duration);
  }, 0);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#0a0a0a",
      }}
    >
      {/* Top Controls */}
      <ContentBuilderControls
        playbackState={{
          ...playbackState,
          totalDuration,
        }}
        viewState={viewState}
        onPlay={handlePlay}
        onStop={handleStop}
        onSpeedChange={handleSpeedChange}
        onTimelineClick={updatePlaybackTime}
        onZoomChange={(zoom) => setViewState({ ...viewState, zoomLevel: zoom })}
        onSave={handleSave}
        onExport={handleExport}
        onJumpToStart={() => jumpToTime(0)}
        onJumpToEnd={() => jumpToTime(totalDuration)}
        onZoomToFit={() => zoomToFit(totalDuration)}
        readOnly={readOnly}
      />

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Timeline Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
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
            onTimelineDragOver={handleTimelineDragOver}
            onTimelineDragLeave={handleTimelineDragLeave}
            onTimelineDrop={handleTimelineDrop}
            onViewportWidthChange={updateViewportWidth}
            isSceneCompatibleWithTrack={isSceneCompatibleWithTrack}
            readOnly={readOnly}
          />
        </Box>

        {/* Scenes Library Sidebar */}
        <Box
          sx={{ width: 350, borderLeft: "1px solid rgba(255, 255, 255, 0.1)" }}
        >
          <ContentBuilderScenesLibrary
            libraryState={libraryState}
            onSearchTermChange={updateSearchTerm}
            onCategoryChange={updateSelectedCategory}
            filteredScenes={getFilteredScenes()}
            onSceneDragStart={handleLibrarySceneDragStart}
            onSceneDragEnd={handleLibrarySceneDragEnd}
            readOnly={readOnly}
          />
        </Box>
      </Box>

      {/* Export Dialog */}
      <ContentBuilderExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExportConfirm}
        sceneCount={scenes.length}
        duration={totalDuration}
      />
    </Box>
  );
};

export default ContentBuilder;
