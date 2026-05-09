"use client";

import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { PlaybackScreen, PlaybackControls } from './';

const CONTROLNET_GUIDE_KEY = 'pfo_show_controlnet_guide';
const SPATIAL_OVERLAY_KEY = 'pfo_show_spatial_overlay';
const SPATIAL_GRID_KEY = 'pfo_show_spatial_grid';

function readPersistedToggle(): boolean {
  try {
    return localStorage.getItem(CONTROLNET_GUIDE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readPersistedSpatialToggle(): boolean {
  try {
    return localStorage.getItem(SPATIAL_OVERLAY_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Grid is on by default; only a stored "false" disables it. */
function readPersistedSpatialGridToggle(): boolean {
  try {
    return localStorage.getItem(SPATIAL_GRID_KEY) !== 'false';
  } catch {
    return true;
  }
}

/**
 * Playback Panel Container
 * 
 * Self-contained panel that manages playback UI.
 * Consumes shared ContentBuilder context and renders:
 * - PlaybackScreen (video/scene display)
 * - PlaybackControls (play/pause/seek)
 * - SaveControls (save button)
 */
export const PlaybackPanel: React.FC = () => {
  // ✅ USE SHARED CONTEXT
  const {
    currentScene,
    playbackState,
    handlePlay,
    handleStop,
    jumpToTime,
    handleSpeedChange,
    tracks,
    readOnly,
  } = useContentBuilder();

  const [showControlnetGuide, setShowControlnetGuide] = useState(readPersistedToggle);
  const [showSpatialOverlay, setShowSpatialOverlay] = useState(readPersistedSpatialToggle);
  const [showSpatialGrid, setShowSpatialGrid] = useState(readPersistedSpatialGridToggle);

  const handleToggleControlnetGuide = useCallback(() => {
    setShowControlnetGuide((prev) => {
      const next = !prev;
      try { localStorage.setItem(CONTROLNET_GUIDE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleToggleSpatialOverlay = useCallback(() => {
    setShowSpatialOverlay((prev) => {
      const next = !prev;
      try { localStorage.setItem(SPATIAL_OVERLAY_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleToggleSpatialGrid = useCallback(() => {
    setShowSpatialGrid((prev) => {
      const next = !prev;
      try { localStorage.setItem(SPATIAL_GRID_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <Box sx={{
      flex: 1,
      minWidth: "320px",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
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
        padding: "8px",
        minHeight: 0,
        overflow: "hidden"
      }}>
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
            totalDuration={playbackState.totalDuration}
            currentTime={playbackState.currentTime}
            readOnly={readOnly}
            tracks={tracks}
            showControlnetGuide={showControlnetGuide}
            showSpatialOverlay={showSpatialOverlay}
            showSpatialGrid={showSpatialGrid}
          />
        </Box>
      </Box>

      {/* Playback Controls Bar */}
      <Box sx={{
        px: 2,
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "48px",
        flexShrink: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        width: "100%",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.02)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.01), 0 1px 2px rgba(0, 0, 0, 0.4)",
      }}>
        {/* Center - Playback Controls */}
        <Box sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: 0,
          background: "transparent",
        }}>
          <PlaybackControls
            playbackState={playbackState}
            onPlay={handlePlay}
            onPause={handlePlay}
            onStop={handleStop}
            onSeek={jumpToTime}
            onSpeedChange={handleSpeedChange}
            readOnly={readOnly}
            showControlnetGuide={showControlnetGuide}
            onToggleControlnetGuide={handleToggleControlnetGuide}
            showSpatialOverlay={showSpatialOverlay}
            onToggleSpatialOverlay={handleToggleSpatialOverlay}
            showSpatialGrid={showSpatialGrid}
            onToggleSpatialGrid={handleToggleSpatialGrid}
          />
        </Box>
      </Box>
    </Box>
  );
};
