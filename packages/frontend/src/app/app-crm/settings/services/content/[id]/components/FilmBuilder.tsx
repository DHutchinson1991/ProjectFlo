"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";

// Import types
import {
  FilmBuilderProps,
  TimelineComponent,
} from "./FilmBuilderTypes";

// Import hooks
import {
  useTimelineData,
  usePlaybackControls,
  useComponentLibrary,
  useDragAndDrop,
} from "./FilmBuilderHooks";

// Import modular components
import FilmBuilderControls from "./FilmBuilderControls";
import FilmBuilderComponentLibrary from "./FilmBuilderComponentLibrary";
import FilmBuilderTimeline from "./FilmBuilderTimeline";
import FilmBuilderExportDialog from "./FilmBuilderExportDialog";

/**
 * Main FilmBuilder component - orchestrates the modular film building experience
 * This component has been refactored from a 2000+ line file into focused modules:
 * - FilmBuilderTypes.ts: All TypeScript interfaces and types
 * - FilmBuilderHooks.ts: Custom hooks for data management and business logic
 * - FilmBuilderControls.tsx: Playback, zoom, and action controls
 * - FilmBuilderComponentLibrary.tsx: Drag-and-drop component library
 * - FilmBuilderTimeline.tsx: Main timeline view with tracks and components
 * - FilmBuilderExportDialog.tsx: Export functionality dialog
 */
const FilmBuilder: React.FC<FilmBuilderProps> = ({
  initialComponents = [],
  onSave,
  onExport,
  readOnly = false,
}) => {
  // Local state for components (since hooks don't provide this)
  const [components, setComponents] = useState<TimelineComponent[]>(initialComponents);

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
  } = usePlaybackControls(components);
  const { libraryState, loadAvailableComponents, getFilteredComponents, updateSearchTerm, updateSelectedCategory } = useComponentLibrary();

  // Timeline ref for drag and drop
  const timelineRef = useRef<HTMLDivElement>(null);

  // Drag and drop functionality with viewport management
  const {
    dragState,
    viewState,
    setViewState,
    handleComponentMouseDown,
    handleLibraryComponentDragStart,
    handleTimelineDragOver,
    handleTimelineDragLeave,
    handleTimelineDrop,
    handleLibraryComponentDragEnd,
    updateViewportWidth,
    scrollToTime,
    zoomToFit,
    isComponentCompatibleWithTrack,
  } = useDragAndDrop(
    components,
    setComponents,
    tracks,
    timelineRef
  );

  // Initialize data on mount
  useEffect(() => {
    loadTimelineLayers();
    loadAvailableComponents();
  }, []); // Empty dependency array since functions are now memoized

  // Update components when initialComponents change
  useEffect(() => {
    if (initialComponents.length > 0) {
      setComponents(initialComponents);
    }
  }, [initialComponents]);

  // Handle save
  const handleSave = useCallback(() => {
    onSave?.(components);
  }, [onSave, components]);

  // Handle export
  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleExportConfirm = useCallback((format: string) => {
    onExport?.(format);
    setExportDialogOpen(false);
  }, [onExport]);

  // Handle timeline click from playback controls - includes viewport scrolling
  const handleTimelineClick = useCallback((time: number) => {
    // Update playback time
    updatePlaybackTime(time);
    // Scroll timeline viewport to follow the new time position
    scrollToTime(time);
  }, [updatePlaybackTime, scrollToTime]);

  // Handle zoom
  const handleZoomChange = useCallback((zoom: number) => {
    setViewState(prev => ({ ...prev, zoomLevel: zoom }));
  }, [setViewState]);

  // Auto-follow playhead during playback
  useEffect(() => {
    if (playbackState.isPlaying) {
      scrollToTime(playbackState.currentTime);
    }
  }, [playbackState.currentTime, playbackState.isPlaying, scrollToTime]);

  // Navigation functions for timeline
  const handleJumpToStart = useCallback(() => {
    jumpToTime(0);
  }, [jumpToTime]);

  const handleJumpToEnd = useCallback(() => {
    jumpToTime(playbackState.totalDuration);
  }, [jumpToTime, playbackState.totalDuration]);

  const handleZoomToFit = useCallback(() => {
    zoomToFit(playbackState.totalDuration);
  }, [zoomToFit, playbackState.totalDuration]);

  return (
    <Box sx={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Controls Section */}
      <FilmBuilderControls
        playbackState={playbackState}
        viewState={viewState}
        onPlay={handlePlay}
        onStop={handleStop}
        onSpeedChange={handleSpeedChange}
        onTimelineClick={handleTimelineClick}
        onZoomChange={handleZoomChange}
        onJumpToStart={handleJumpToStart}
        onJumpToEnd={handleJumpToEnd}
        onZoomToFit={handleZoomToFit}
        onSave={!readOnly ? handleSave : undefined}
        onExport={!readOnly ? handleExport : undefined}
        readOnly={readOnly}
      />

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Timeline Area - compact height based on tracks */}
        <Box sx={{
          overflow: "hidden",
          px: 2,
          py: 1,
          // Calculate height based on tracks: 4 tracks * 40px + separator gap + info bar
          height: (tracks.length * 40) + 24 + 32 + 16, // tracks + separator + info bar + padding
          flexShrink: 0, // Don't shrink
        }}>
          <FilmBuilderTimeline
            components={components}
            tracks={tracks}
            playbackState={playbackState}
            viewState={viewState}
            dragState={dragState}
            timelineRef={timelineRef}
            onComponentMouseDown={handleComponentMouseDown}
            onTimelineDragOver={handleTimelineDragOver}
            onTimelineDragLeave={handleTimelineDragLeave}
            onTimelineDrop={handleTimelineDrop}
            onViewportWidthChange={updateViewportWidth}
            isComponentCompatibleWithTrack={isComponentCompatibleWithTrack}
            readOnly={readOnly}
          />
        </Box>

        {/* Component Library Below Timeline */}
        <Box sx={{ flex: 1, borderTop: 1, borderColor: "divider", minHeight: 200 }}>
          <FilmBuilderComponentLibrary
            libraryState={libraryState}
            filteredComponents={getFilteredComponents()}
            onSearchTermChange={updateSearchTerm}
            onCategoryChange={updateSelectedCategory}
            onComponentDragStart={handleLibraryComponentDragStart}
            onComponentDragEnd={handleLibraryComponentDragEnd}
            readOnly={readOnly}
          />
        </Box>
      </Box>

      {/* Export Dialog */}
      <FilmBuilderExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExportConfirm}
        componentCount={components.length}
        duration={Math.max(...components.map(c => c.start_time + c.duration), 0)}
      />
    </Box>
  );
};

export default FilmBuilder;
