"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha, lighten } from "@mui/material/styles";
import { TimelineScene } from "@/features/content/content-builder/types/timeline";
import { getDefaultTrackColor } from "../../../utils/colorUtils";
import type { SceneBeat } from "@/features/content/scenes/types/beats";

interface BeatsContainerProps {
  scene: TimelineScene;
  beats: SceneBeat[];
  trackId?: number;
  trackType?: string;
  trackName?: string;
  readOnly?: boolean;
}

export const BeatsContainer: React.FC<BeatsContainerProps> = ({
  scene,
  beats,
  trackId,
  trackType,
  trackName,
  readOnly,
}) => {
  const isContainer = (scene as any).database_type === "MOMENTS_CONTAINER";
  if (!isContainer || beats.length === 0) return null;

  const totalBeatsDuration = beats.reduce((sum, beat) => sum + (beat.duration_seconds || 0), 0);
  if (totalBeatsDuration === 0) return null;

  const rawTrackType = (trackType || scene.scene_type || "video").toString();
  const normalizedTrackType = rawTrackType.toUpperCase();
  const trackBaseColor = getDefaultTrackColor(rawTrackType);
  const beatBaseColor = lighten(trackBaseColor, 0.35);
  const beatHoverColor = alpha(beatBaseColor, 0.9);

  const resolveSceneSetup = () => {
    const setup = (scene as any).recording_setup || null;
    if (!setup) return null;
    return {
      camera_track_ids: Array.isArray(setup.camera_assignments)
        ? setup.camera_assignments.map((assignment: any) => assignment.track_id)
        : [],
      audio_track_ids: setup.audio_track_ids || [],
      graphics_enabled: !!setup.graphics_enabled,
    };
  };

  const sceneSetup = resolveSceneSetup();

  const isBeatVisibleOnTrack = (beat: SceneBeat) => {
    const beatSetup = beat.recording_setup || sceneSetup;
    if (!beatSetup) return true;

    const isVideoTrack = normalizedTrackType === "VIDEO";
    const isAudioTrack = normalizedTrackType === "AUDIO";
    const isGraphicsTrack = normalizedTrackType === "GRAPHICS";

    if (isVideoTrack && trackId) {
      return (beatSetup.camera_track_ids || []).includes(trackId);
    }
    if (isAudioTrack && trackId) {
      return (beatSetup.audio_track_ids || []).includes(trackId);
    }
    if (isGraphicsTrack) {
      return !!beatSetup.graphics_enabled;
    }

    return true;
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0, 
        left: 0,
        right: 0,
        bottom: 0, 
        display: "flex",
        pointerEvents: "none",
        borderRadius: 1,
        overflow: "hidden", // Ensure children respect border radius
      }}
    >
      {beats.map((beat, idx) => {
        const isVisible = isBeatVisibleOnTrack(beat);
        const beatDuration = beat.duration_seconds || 0;
        const flexVal = totalBeatsDuration > 0 ? beatDuration / totalBeatsDuration : 1;
        
        // Match MomentsContainer styling
        const isEven = idx % 2 === 0;
        const tileColor = isEven 
            ? alpha(beatBaseColor, 0.95)
            : alpha(beatBaseColor, 0.85);

        return (
          <Box
            key={`beat-${beat.id || idx}`}
            className="beat-item" // For potential future selection
            sx={{
              flex: flexVal,
              minWidth: 4,
              position: 'relative',
              
              // Visual Styling matching MomentsContainer
              bgcolor: isVisible ? tileColor : "transparent",
              backgroundImage: isVisible ? `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)` : 'none',
              backgroundBlendMode: 'screen',
              
              boxSizing: 'border-box',
              borderRight: idx < beats.length - 1 ? `1px solid rgba(0,0,0,0.5)` : 'none',
              borderLeft: 'none', // Removed previous left border
              
              borderRadius: 1, 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              transition: "all 0.15s ease-out",
              zIndex: 2,
              pointerEvents: isVisible ? "auto" : "none", // Enable pointer events for hover effects
              
              "&:hover": isVisible ? { 
                bgcolor: beatHoverColor,
                zIndex: 10,
                boxShadow: '0 0 0 1px rgba(123, 97, 255, 0.7), 0 0 14px rgba(123, 97, 255, 0.55)',
                outline: '1px solid rgba(123, 97, 255, 0.35)',
              } : {},
            }}
          >
            {isVisible && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem", // Matched font size
                  fontWeight: 500,     // Matched font weight
                  color: "rgba(255, 255, 255, 0.95)", // Matched text color
                  px: 0.5,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  pointerEvents: "none",
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)', // Added text shadow for legibility
                }}
              >
                {beat.name}
              </Typography>
            )}
            
            {/* Fallback visual for invisible beats (spacers) */}
            {!isVisible && (
                <Box 
                    sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        bgcolor: 'transparent',
                        "&:hover": {
                             bgcolor: 'rgba(123, 97, 255, 0.05)',
                             boxShadow: 'inset 0 0 0 1px rgba(123, 97, 255, 0.2)',
                             pointerEvents: 'auto'
                        }
                    }}
                />
            )}
          </Box>
        );
      })}
    </Box>
  );
};
