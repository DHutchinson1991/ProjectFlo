"use client";

import React from "react";
import { Box, Typography, Chip, Tooltip, IconButton } from "@mui/material";
import {
    AccessTime as TimeIcon,
    MovieFilter as MovieFilterIcon,
    MusicNote as MusicIcon,
    DeleteOutline as DeleteOutlineIcon,
} from "@mui/icons-material";
import { ScenesLibrary, SceneType } from "@/features/content/scenes/types";
import { formatTime } from "@/shared/utils/formatUtils";
import { getSceneColor } from "../../../utils/colorUtils";
import { getScenePrimaryMediaType } from "@/features/content/scenes/utils/scene-data-utils";

interface SceneCardProps {
    scene: ScenesLibrary;
    isSelected?: boolean;
    onClick?: () => void;
    readOnly?: boolean;
    showDelete?: boolean;
    onDelete?: () => void;
}

const SceneCard: React.FC<SceneCardProps> = ({
    scene,
    isSelected = false,
    onClick,
    readOnly = false,
    showDelete = false,
    onDelete,
}) => {
    const primaryMediaType = getScenePrimaryMediaType(scene);
    const sceneColor = getSceneColor(primaryMediaType || 'VIDEO');

    const musicCount = (scene.media_components || []).filter(c => c.media_type === 'MUSIC').length;
    const momentsCount = scene.moments?.length || scene.moments_count || 0;
    const isRealtimeScene = scene.type === SceneType.MOMENTS ? true : scene.type === SceneType.MONTAGE ? false : momentsCount > 0;
    const modeLabel = isRealtimeScene ? "Realtime Scene" : "Montage";
    const modeColor = isRealtimeScene ? "#4CAF50" : "#FFB020";

    const totalDurationSeconds = (scene.moments || []).reduce((total, moment) => {
        const duration = moment.duration_seconds || moment.duration || moment.estimated_duration || 0;
        return total + duration;
    }, 0) || scene.estimated_duration || 0;

    const recordingSetup = scene.recording_setup || null;
    const cameraCount = recordingSetup?.camera_count ?? 0;
    const audioCount = recordingSetup?.audio_count ?? 0;
    const graphicsEnabled = recordingSetup?.graphics_enabled === true;

    return (
        <Box
            onClick={onClick}
            sx={{
                position: "relative",
                width: "100%",
                minHeight: "120px", // Ensure consistent height
                p: 2,
                borderRadius: 2,
                bgcolor: isSelected
                    ? "rgba(123, 97, 255, 0.2)"
                    : "rgba(8, 8, 12, 0.9)",
                border: isSelected
                    ? "2px solid rgba(123, 97, 255, 0.6)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                cursor: readOnly ? "default" : "pointer",
                transition: "all 0.2s ease-in-out",
                boxSizing: "border-box",
                overflow: "hidden",
                "&:hover": readOnly ? {} : {
                    transform: "translateY(-2px)",
                    bgcolor: isSelected
                        ? "rgba(123, 97, 255, 0.3)"
                        : "rgba(8, 8, 12, 0.95)",
                    border: "1px solid rgba(123, 97, 255, 0.4)",
                    boxShadow: "0 4px 12px rgba(123, 97, 255, 0.15)",
                },
                "&:active": readOnly ? {} : {
                    cursor: "grabbing",
                    transform: "translateY(0)",
                },
            }}
        >
            {showDelete && !readOnly && (
                <Tooltip title="Remove from library" arrow>
                    <IconButton
                        size="small"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete?.();
                        }}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            color: "rgba(255,255,255,0.6)",
                            bgcolor: "rgba(0,0,0,0.35)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            "&:hover": { color: "#FF6B9D", bgcolor: "rgba(255,107,157,0.15)" },
                        }}
                    >
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            )}
            {/* Scene Mode Icon */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                }}
            >
                <Tooltip title={modeLabel} arrow>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: `${modeColor}20`,
                            color: modeColor,
                        }}
                    >
                        {isRealtimeScene ? <TimeIcon /> : <MovieFilterIcon />}
                    </Box>
                </Tooltip>
            </Box>

            {/* Scene Name */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: "white",
                    fontWeight: 600,
                    mb: 0.5,
                    fontSize: "0.875rem",
                    lineHeight: 1.2,
                }}
            >
                {scene.name}
            </Typography>

            {/* Scene Description */}
            {scene.description && (
                <Typography
                    variant="body2"
                    sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.75rem",
                        lineHeight: 1.3,
                        mb: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                    }}
                >
                    {scene.description}
                </Typography>
            )}

            {/* Scene Duration and Moments Count */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.7rem",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                        {formatTime(totalDurationSeconds)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: modeColor }}>
                        {isRealtimeScene ? <TimeIcon sx={{ fontSize: 13 }} /> : <MovieFilterIcon sx={{ fontSize: 13 }} />}
                        <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                            {modeLabel}
                        </Typography>
                    </Box>
                    {musicCount > 0 && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "rgba(139, 92, 246, 0.9)" }}>
                            <MusicIcon sx={{ fontSize: 13 }} />
                            <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                                Music
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Show Moments Count */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                     {/* Moments Count */}
                    {isRealtimeScene && momentsCount > 0 && (
                         <Chip
                            label={`${momentsCount} Moments`}
                            size="small"
                            sx={{
                                fontSize: "0.6rem",
                                height: 16,
                                bgcolor: "rgba(255, 255, 255, 0.15)", // White/Grey
                                color: "rgba(255, 255, 255, 0.9)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                padding: '0 2px',
                                '& .MuiChip-label': { paddingLeft: 1, paddingRight: 1 }
                            }}
                        />
                    )}
                    {cameraCount > 0 && (
                        <Chip
                            label={`${cameraCount} Cameras`}
                            size="small"
                            sx={{
                                fontSize: "0.6rem",
                                height: 16,
                                bgcolor: "rgba(76, 175, 80, 0.15)",
                                color: "rgba(76, 175, 80, 0.9)",
                                border: "1px solid rgba(76, 175, 80, 0.35)",
                                padding: '0 2px',
                                '& .MuiChip-label': { paddingLeft: 1, paddingRight: 1 }
                            }}
                        />
                    )}
                    {audioCount > 0 && (
                        <Chip
                            label={`${audioCount} Audio`}
                            size="small"
                            sx={{
                                fontSize: "0.6rem",
                                height: 16,
                                bgcolor: "rgba(255, 107, 157, 0.15)",
                                color: "rgba(255, 107, 157, 0.9)",
                                border: "1px solid rgba(255, 107, 157, 0.35)",
                                padding: '0 2px',
                                '& .MuiChip-label': { paddingLeft: 1, paddingRight: 1 }
                            }}
                        />
                    )}
                    {graphicsEnabled && (
                        <Chip
                            label="Graphics"
                            size="small"
                            sx={{
                                fontSize: "0.6rem",
                                height: 16,
                                bgcolor: "rgba(0, 229, 255, 0.15)",
                                color: "rgba(0, 229, 255, 0.9)",
                                border: "1px solid rgba(0, 229, 255, 0.35)",
                                padding: '0 2px',
                                '& .MuiChip-label': { paddingLeft: 1, paddingRight: 1 }
                            }}
                        />
                    )}
                    {!isRealtimeScene && momentsCount > 0 && (
                        <Chip
                            label={`${momentsCount} Beats`}
                            size="small"
                            sx={{
                                fontSize: "0.6rem",
                                height: 16,
                                bgcolor: "rgba(255, 255, 255, 0.15)",
                                color: "rgba(255, 255, 255, 0.9)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                padding: '0 2px',
                                '& .MuiChip-label': { paddingLeft: 1, paddingRight: 1 }
                            }}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default SceneCard;
