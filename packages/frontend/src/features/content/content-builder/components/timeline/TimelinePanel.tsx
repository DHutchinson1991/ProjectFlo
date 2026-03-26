"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { TimelineScene } from '@/lib/types/timeline';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { Timeline } from './infrastructure';
import { TIMELINE_CONFIG } from '../../constants/constants';

interface TimelinePanelProps {
  timelineRef: React.RefObject<HTMLDivElement>;
}

/**
 * Timeline Panel Container
 * 
 * Self-contained timeline panel that manages all timeline UI.
 * Consumes shared ContentBuilder context and renders timeline components.
 */
export const TimelinePanel: React.FC<TimelinePanelProps> = ({ timelineRef }) => {
  // ✅ USE SHARED CONTEXT
  const {
    scenes,
    tracks,
    playbackState,
    viewState,
    dragState,
    handleSceneMouseDown,
    handleSceneDelete,
    setViewportWidth,
    isSceneCompatibleWithTrack,
    readOnly,
    sceneGroups,
    getGroupForScene,
    isSceneInCollapsedGroup,
    setZoom,
    toggleSnap,
    fitToView,
    jumpToTime,
    scrollToTime,
    setShowCreateSceneDialog,
    deleteScene,
    reorderScene,
    setScenes,
  } = useContentBuilder();

  const autoFitDoneRef = useRef(false);
  const prevSceneCountRef = useRef(0);
  const [hoveredMomentId, setHoveredMomentId] = useState<number | null>(null);

  // Calculate total duration from all scenes
  const totalSceneDuration = scenes.length > 0
    ? Math.max(...scenes.map(s => s.start_time + s.duration))
    : 0;

  // Auto-fit viewport to show ALL scenes on initial load
  // KEY: We must wait for the REAL viewport width (from ResizeObserver), not the default 800px
  useEffect(() => {
    const isRealViewportWidth = viewState.viewportWidth > 0 &&
      viewState.viewportWidth !== TIMELINE_CONFIG.DEFAULT_VIEWPORT_WIDTH;

    if (!scenes || scenes.length === 0) {
      autoFitDoneRef.current = false;
      prevSceneCountRef.current = 0;
      return;
    }

    // Only auto-fit once when: scenes are loaded, REAL viewport width is measured, and duration is known
    if (!autoFitDoneRef.current && scenes.length > 0 && isRealViewportWidth && totalSceneDuration > 0) {
      autoFitDoneRef.current = true;
      fitToView(totalSceneDuration);
    }

    prevSceneCountRef.current = scenes.length;
  }, [scenes, viewState.viewportWidth, totalSceneDuration, fitToView]);

  // Adapter for Timeline which expects (e, scene) parameter order
  const handleSceneMouseDownAdapter = useCallback((e: React.MouseEvent, scene: TimelineScene) => {
    handleSceneMouseDown(e, scene);
  }, [handleSceneMouseDown]);

  // Wrap handleSceneDelete to ensure stable callback reference and adapt scene to ID
  const handleSceneDeleteCallback = useCallback((scene: TimelineScene) => {
    deleteScene(String(scene.id));
  }, [deleteScene]);

  // Adapter for deleting multiple scenes by ID (from scene groups)
  const handleDeleteSceneGroup = useCallback(async (sceneIds: number[]) => {
    // Delete each scene in the group one by one
    for (const id of sceneIds) {
      try {
        await deleteScene(String(id));
      } catch (error) {
        console.error(`Failed to delete scene ${id}:`, error);
      }
    }
  }, [deleteScene]);

  // Adapter for scene compatibility check
  const isSceneCompatibleWithTrackAdapter = useCallback((sceneType: string, trackType: string) => {
    return isSceneCompatibleWithTrack(sceneType as any, trackType);
  }, [isSceneCompatibleWithTrack]);

  // Adapter for reorder scene
  const handleReorderScene = useCallback((direction: 'left' | 'right', sceneName: string) => {
    reorderScene(direction, sceneName);
  }, [reorderScene]);

  // Adapter for updating a single scene
  const handleUpdateScene = useCallback((updatedScene: TimelineScene) => {
    setScenes(prev => prev.map(scene => (
      scene.id === updatedScene.id ? updatedScene : scene
    )));
  }, [setScenes]);

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#111",
      borderTop: "1px solid #333",
      minHeight: "300px"
    }}>
      <Timeline
        scenes={scenes}
        tracks={tracks}
        playbackState={{ ...playbackState, totalDuration: playbackState.totalDuration }}
        viewState={viewState}
        dragState={dragState}
        timelineRef={timelineRef}
        onSceneMouseDown={handleSceneMouseDownAdapter}
        onSceneDelete={handleSceneDeleteCallback}
        onViewportWidthChange={setViewportWidth}
        isSceneCompatibleWithTrack={isSceneCompatibleWithTrackAdapter}
        readOnly={readOnly}
        sceneGroups={sceneGroups}
        getGroupForScene={getGroupForScene}
        isSceneInCollapsedGroup={isSceneInCollapsedGroup}
        onZoomChange={setZoom}
        onSnapToggle={toggleSnap}
        onFitToView={() => fitToView(totalSceneDuration || 60)}
        onTimelineClick={jumpToTime}
        scrollToTime={scrollToTime}
        onAddScene={() => setShowCreateSceneDialog(true)}
        onReorderScene={handleReorderScene}
        onDeleteScene={handleDeleteSceneGroup}
        onUpdateScene={handleUpdateScene}
        hoveredMomentId={hoveredMomentId}
        onMomentHover={setHoveredMomentId}
      />
    </Box>
  );
};
