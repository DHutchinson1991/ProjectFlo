"use client";

import React from 'react';
import { Box } from '@mui/material';
import { useContentBuilder } from '../../../context/ContentBuilderContext';
import { PlaybackScreen, PlaybackControls } from './';

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
          />
        </Box>
      </Box>

      {/* Playback Controls Bar */}
      <Box sx={{
        padding: "6px 16px",
        borderBottom: "1px solid #2a2a2a",
        backgroundColor: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "44px",
        maxHeight: "44px",
        flexShrink: 0,
        overflow: "visible",
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
          px: 2,
          py: 0.5,
          bgcolor: "rgba(0, 0, 0, 0.4)",
          borderRadius: 1.5,
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.02)"
        }}>
          <PlaybackControls
            playbackState={playbackState}
            onPlay={handlePlay}
            onPause={handlePlay}
            onStop={handleStop}
            onSeek={jumpToTime}
            onSpeedChange={handleSpeedChange}
            readOnly={readOnly}
          />
        </Box>
      </Box>
    </Box>
  );
};
