"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Close as CloseIcon, DragIndicator as DragIcon } from "@mui/icons-material";
import { TimelineScene } from "../types/sceneTypes";
import { ViewState } from "../types/dragDropTypes";
import { formatTime } from "../utils";

interface TimelineSceneElementProps {
    scene: TimelineScene;
    trackPosition: number;
    viewState: ViewState;
    onMouseDown?: (e: React.MouseEvent, scene: TimelineScene) => void;
    onDelete?: (scene: TimelineScene) => void;
    readOnly?: boolean;
}

const TimelineSceneElement: React.FC<TimelineSceneElementProps> = ({
    scene,
    trackPosition,
    viewState,
    onMouseDown,
    onDelete,
    readOnly = false,
}) => {
    const sceneWidth = scene.duration * viewState.zoomLevel;
    const sceneLeft = scene.start_time * viewState.zoomLevel;

    // Calculate if scene name should be visible based on width
    const showText = sceneWidth > 60;
    const showDeleteButton = sceneWidth > 80 && !readOnly;

    return (
        <Box
            style={{
                position: "absolute",
                left: sceneLeft,
                top: trackPosition + 4, // 4px from top of track
                width: Math.max(sceneWidth, 20), // Minimum 20px width
                height: 32, // Track height minus padding
            }}
            onMouseDown={(e) => onMouseDown?.(e, scene)}
            sx={{
                bgcolor: scene.color,
                borderRadius: 1,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: readOnly ? "default" : "grab",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: showText ? 1 : 0.5,
                transition: "all 0.2s ease-in-out",
                overflow: "hidden",
                "&:hover": readOnly ? {} : {
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    transform: "translateY(-1px)",
                },
                "&:active": readOnly ? {} : {
                    cursor: "grabbing",
                    transform: "translateY(0)",
                },
            }}
        >
            {/* Drag handle - only show if there's space */}
            {!readOnly && sceneWidth > 40 && (
                <DragIcon
                    sx={{
                        fontSize: 14,
                        color: "rgba(255, 255, 255, 0.7)",
                        cursor: "grab"
                    }}
                />
            )}

            {/* Scene content */}
            <Box sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                ml: !readOnly && sceneWidth > 40 ? 0.5 : 0,
            }}>
                {showText && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: "white",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            lineHeight: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {scene.name}
                    </Typography>
                )}

                {/* Duration indicator for smaller scenes */}
                {!showText && sceneWidth > 25 && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.6rem",
                            lineHeight: 1,
                            textAlign: "center",
                        }}
                    >
                        {formatTime(scene.duration)}
                    </Typography>
                )}
            </Box>

            {/* Delete button - only show if there's space and not read-only */}
            {showDeleteButton && onDelete && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(scene);
                    }}
                    sx={{
                        width: 20,
                        height: 20,
                        color: "rgba(255, 255, 255, 0.7)",
                        "&:hover": {
                            color: "white",
                            bgcolor: "rgba(255, 255, 255, 0.1)",
                        },
                    }}
                >
                    <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
            )}
        </Box>
    );
};

export default TimelineSceneElement;
