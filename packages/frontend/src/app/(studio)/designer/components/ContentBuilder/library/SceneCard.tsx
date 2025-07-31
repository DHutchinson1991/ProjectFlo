"use client";

import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import {
    Videocam as VideoIcon,
    VolumeUp as AudioIcon,
    Palette as GraphicsIcon,
    MusicNote as MusicIcon,
    AccessTime as TimeIcon,
} from "@mui/icons-material";
import { useDraggable } from "@dnd-kit/core";
import { ScenesLibrary } from "../types/sceneTypes";
import { getSceneIconComponent, formatTime } from "../utils";
import { getSceneColor } from "../utils/colorUtils";
import { getScenePrimaryMediaType, getSceneMediaTypes, isMultiMediaScene } from "../utils/sceneUtils";

interface SceneCardProps {
    scene: ScenesLibrary;
    isSelected?: boolean;
    onClick?: () => void;
    readOnly?: boolean;
}

const SceneCard: React.FC<SceneCardProps> = ({
    scene,
    isSelected = false,
    onClick,
    readOnly = false,
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `library-scene-${scene.id}`,
        data: {
            type: 'library-scene',
            scene,
        },
        disabled: readOnly,
    });

    const iconComponents = {
        VideoIcon,
        AudioIcon,
        GraphicsIcon,
        MusicIcon,
    };

    // Get media types and primary type using new utility functions
    const mediaTypes = getSceneMediaTypes(scene);
    const primaryMediaType = getScenePrimaryMediaType(scene);
    const hasMultipleMediaTypes = isMultiMediaScene(scene);

    const icon = getSceneIconComponent(primaryMediaType, iconComponents);
    const sceneColor = getSceneColor(primaryMediaType);

    return (
        <Box
            ref={setNodeRef}
            {...(readOnly ? {} : listeners)}
            {...(readOnly ? {} : attributes)}
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
                cursor: readOnly ? "default" : "grab",
                transition: isDragging ? "none" : "all 0.2s ease-in-out",
                boxSizing: "border-box",
                overflow: "hidden",
                // When dragging, make the card semi-transparent but keep it in place
                // The DragOverlay will handle the visual drag representation
                opacity: isDragging ? 0.5 : 1,
                // Ensure no layout shifts during drag
                isolation: "isolate",
                contain: "layout style", // CSS containment for stable layout
                "&:hover": readOnly || isDragging ? {} : {
                    transform: "translateY(-2px)",
                    bgcolor: isSelected
                        ? "rgba(123, 97, 255, 0.3)"
                        : "rgba(8, 8, 12, 0.95)",
                    border: "1px solid rgba(123, 97, 255, 0.4)",
                    boxShadow: "0 4px 12px rgba(123, 97, 255, 0.15)",
                },
                "&:active": readOnly || isDragging ? {} : {
                    cursor: "grabbing",
                    transform: "translateY(0)",
                },
            }}
        >
            {/* Scene Icon */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: `${sceneColor}20`,
                        color: sceneColor,
                        mr: 1.5,
                    }}
                >
                    {icon}
                </Box>

                {/* Show multiple media type chips if scene has multiple components */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {hasMultipleMediaTypes ? (
                        // Show all unique media types when multiple exist
                        mediaTypes.map((mediaType) => (
                            <Chip
                                key={mediaType}
                                label={mediaType}
                                size="small"
                                sx={{
                                    fontSize: "0.65rem",
                                    height: 18,
                                    bgcolor: `${getSceneColor(mediaType)}15`,
                                    color: getSceneColor(mediaType),
                                    border: `1px solid ${getSceneColor(mediaType)}30`,
                                }}
                            />
                        ))
                    ) : (
                        // Show single chip when only one media type
                        <Chip
                            label={primaryMediaType}
                            size="small"
                            sx={{
                                fontSize: "0.7rem",
                                height: 20,
                                bgcolor: `${sceneColor}15`,
                                color: sceneColor,
                                border: `1px solid ${sceneColor}30`,
                            }}
                        />
                    )}
                </Box>
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

            {/* Scene Duration and Media Components Count */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.7rem",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                        {formatTime(scene.estimated_duration || 0)}
                    </Typography>
                </Box>

                {/* Show media components count if multiple */}
                {hasMultipleMediaTypes && (
                    <Chip
                        label={`${mediaTypes.length} media types`}
                        size="small"
                        sx={{
                            fontSize: "0.65rem",
                            height: 16,
                            bgcolor: "rgba(123, 97, 255, 0.2)",
                            color: "rgba(123, 97, 255, 0.9)",
                            border: "1px solid rgba(123, 97, 255, 0.3)",
                        }}
                    />
                )}
            </Box>
        </Box>
    );
};

export default SceneCard;
