"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { SpatialTab } from './SpatialTab';

/**
 * Details Panel — Spatial View
 * Shows the floor plan with camera/subject positions for the current scene.
 */
export const DetailsPanel: React.FC = () => {
  const { currentScene, currentMoment, linkedActivityId, packageId } = useContentBuilder();
  const scene = currentScene;
  const momentId = currentMoment?.id ? Number(currentMoment.id) : null;
  // Package-mode space-slot overrides (SpaceSlotMomentSubject / SpaceSlotMomentCamera)
  // are FK'd to PackageActivityMoment, not SceneMoment. Surface the link here so
  // the overlay's moment-override filter matches what AI blocking actually writes.
  const packageMomentId = (currentMoment as any)?.package_activity_moment_id ?? null;
  const momentName = currentMoment?.name ?? null;

  return (
    <Box sx={{
      width: "45%",
      minWidth: "400px",
      maxWidth: "580px",
      flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.08)",
      background: "#0d0d0d",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      '@media (max-width: 1200px)': {
        width: '100%',
        maxWidth: '100%',
        borderRight: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }
    }}>
      {/* Panel Header */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        bgcolor: "#111",
        flexShrink: 0,
      }}>
        <MapRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }} />
        <Box sx={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Spatial
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 1 }}>
        <SpatialTab sceneId={scene?.id ? Number(scene.id) : null} activityId={linkedActivityId} packageId={packageId} momentId={momentId} packageMomentId={packageMomentId} momentName={momentName} />
      </Box>
    </Box>
  );
};
