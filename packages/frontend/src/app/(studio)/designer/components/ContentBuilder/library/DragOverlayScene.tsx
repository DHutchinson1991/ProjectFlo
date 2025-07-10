"use client";

import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import {
    DragIndicator as DragIndicatorIcon,
    Videocam as VideoIcon,
    VolumeUp as AudioIcon,
    Palette as GraphicsIcon,
    MusicNote as MusicIcon,
    AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { ScenesLibrary, TimelineScene } from "../types";
import { formatTime, getSceneColorByType, getSceneIconComponent } from "../utils";
import { getScenePrimaryMediaType, isMultiMediaScene } from "../utils/sceneUtils";

interface DragOverlaySceneProps {
    scene: ScenesLibrary | TimelineScene;
    isFromLibrary?: boolean;
}

export function DragOverlayScene({ scene, isFromLibrary = false }: DragOverlaySceneProps) {
    // Get scene type for display
    const sceneType = isFromLibrary
        ? getScenePrimaryMediaType(scene as ScenesLibrary)
        : (scene as TimelineScene).scene_type || (scene as TimelineScene).database_type;

    const sceneName = scene.name;
    const sceneColor = getSceneColorByType(sceneType);
    const sceneIcon = getSceneIconComponent(sceneType, {
        VideoIcon,
        AudioIcon,
        GraphicsIcon,
        MusicIcon,
    });

    // Check if this is a multi-media scene (for library scenes)
    const isMultiMedia = isFromLibrary ? isMultiMediaScene(scene as ScenesLibrary) : false;

    // Get duration for display
    const duration = isFromLibrary
        ? (scene as ScenesLibrary).estimated_duration || 30
        : (scene as TimelineScene).duration;

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                background: `linear-gradient(135deg, ${sceneColor}20 0%, ${sceneColor}10 100%)`,
                backdropFilter: 'blur(20px)',
                borderRadius: 2,
                border: `2px solid ${sceneColor}`,
                minWidth: 200,
                maxWidth: 300,
                boxShadow: `0 8px 32px ${sceneColor}40`,
                cursor: 'grabbing',
                transform: 'rotate(3deg)',
                transition: 'all 0.2s ease-in-out',
                zIndex: 1000,
            }}
        >
            <DragIndicatorIcon sx={{ color: sceneColor, fontSize: '1rem' }} />

            <Box
                sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: sceneColor,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 24,
                    height: 24,
                }}
            >
                {sceneIcon}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    sx={{
                        color: 'white',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {sceneName}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={sceneType}
                        size="small"
                        sx={{
                            background: `${sceneColor}30`,
                            color: sceneColor,
                            border: `1px solid ${sceneColor}`,
                            fontSize: '0.65rem',
                            height: 20,
                            "& .MuiChip-label": { px: 0.5 }
                        }}
                    />

                    {/* Show multi-media indicator for library scenes */}
                    {isMultiMedia && (
                        <Chip
                            label="Multi"
                            size="small"
                            sx={{
                                background: "rgba(123, 97, 255, 0.3)",
                                color: "rgba(123, 97, 255, 1)",
                                border: "1px solid rgba(123, 97, 255, 0.6)",
                                fontSize: '0.6rem',
                                height: 18,
                                "& .MuiChip-label": { px: 0.25 }
                            }}
                        />
                    )}

                    {duration && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <AccessTimeIcon sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '0.65rem',
                                    fontWeight: 'medium'
                                }}
                            >
                                {formatTime(duration)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
