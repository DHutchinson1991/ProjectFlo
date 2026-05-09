"use client";

import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    GridOn as ControlnetIcon,
    ViewInAr as SpatialIcon,
    Grid3x3 as SpatialGridIcon,
} from "@mui/icons-material";
import { PlaybackState } from "@/features/content/content-builder/types/timeline";
import { formatTime } from "@/shared/utils/formatUtils";

interface PlaybackControlsProps {
    playbackState: PlaybackState;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    onSpeedChange?: (speed: number) => void;
    showControlnetGuide?: boolean;
    onToggleControlnetGuide?: () => void;
    showSpatialOverlay?: boolean;
    onToggleSpatialOverlay?: () => void;
    showSpatialGrid?: boolean;
    onToggleSpatialGrid?: () => void;
    readOnly?: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    playbackState,
    onPlay,
    onPause,
    onStop,
    showControlnetGuide = false,
    onToggleControlnetGuide,
    showSpatialOverlay = false,
    onToggleSpatialOverlay,
    showSpatialGrid = true,
    onToggleSpatialGrid,
    onSeek, // eslint-disable-line @typescript-eslint/no-unused-vars
    onSpeedChange,
    readOnly = false,
}) => {
    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
    const squareButtonSx = {
        width: 36,
        height: 36,
        borderRadius: 1.5,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        bgcolor: "rgba(255, 255, 255, 0.04)",
        transition: "all 0.2s ease",
        "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.08)",
            borderColor: "rgba(255, 255, 255, 0.18)",
        },
        "&:disabled": {
            color: "rgba(255, 255, 255, 0.3)",
            bgcolor: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.08)",
        },
    };

    return (
        <Box
            sx={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
                alignItems: "center",
                gap: 2,
                minWidth: 0,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, justifySelf: "start" }}>
                {onSpeedChange && (
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.25,
                        height: 36,
                        bgcolor: "rgba(255, 255, 255, 0.04)",
                        borderRadius: 1.5,
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "rgba(255, 255, 255, 0.65)",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                            }}
                        >
                            Speed
                        </Typography>
                        <select
                            value={playbackState.playbackSpeed}
                            onChange={(e) => onSpeedChange(Number(e.target.value))}
                            disabled={readOnly}
                            style={{
                                backgroundColor: "transparent",
                                color: "rgba(255, 255, 255, 0.92)",
                                border: "none",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                height: "100%",
                                minWidth: "48px",
                                outline: "none",
                            }}
                        >
                            {speedOptions.map(speed => (
                                <option key={speed} value={speed} style={{ backgroundColor: "#111" }}>
                                    {speed}x
                                </option>
                            ))}
                        </select>
                    </Box>
                )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, justifySelf: "center" }}>
                <IconButton
                    onClick={onStop}
                    disabled={readOnly}
                    size="small"
                    sx={{
                        ...squareButtonSx,
                        color: "rgba(255, 255, 255, 0.78)",
                    }}
                >
                    <StopIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <IconButton
                    onClick={playbackState.isPlaying ? onPause : onPlay}
                    disabled={readOnly}
                    sx={{
                        ...squareButtonSx,
                        color: playbackState.isPlaying ? "rgba(255, 255, 255, 0.92)" : "rgba(123, 97, 255, 0.95)",
                        bgcolor: playbackState.isPlaying ? "rgba(244, 67, 54, 0.15)" : "rgba(123, 97, 255, 0.15)",
                        border: playbackState.isPlaying
                            ? "1px solid rgba(244, 67, 54, 0.3)"
                            : "1px solid rgba(123, 97, 255, 0.32)",
                        "&:hover": {
                            bgcolor: playbackState.isPlaying ? "rgba(244, 67, 54, 0.24)" : "rgba(123, 97, 255, 0.24)",
                            borderColor: playbackState.isPlaying
                                ? "rgba(244, 67, 54, 0.46)"
                                : "rgba(123, 97, 255, 0.48)",
                        },
                    }}
                >
                    {playbackState.isPlaying ? (
                        <PauseIcon sx={{ fontSize: 18 }} />
                    ) : (
                        <PlayIcon sx={{ fontSize: 18 }} />
                    )}
                </IconButton>

                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.25,
                    height: 36,
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                    borderRadius: 1.5,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    minWidth: 0,
                }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255, 255, 255, 0.95)",
                            fontSize: "0.78rem",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {formatTime(playbackState.currentTime)}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255, 255, 255, 0.35)",
                            fontSize: "0.72rem",
                        }}
                    >
                        /
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255, 255, 255, 0.68)",
                            fontSize: "0.78rem",
                            fontFamily: "monospace",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {formatTime(playbackState.totalDuration)}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75, justifySelf: "end" }}>
                {onToggleControlnetGuide && (
                    <IconButton
                        onClick={onToggleControlnetGuide}
                        size="small"
                        sx={{
                            ...squareButtonSx,
                            color: showControlnetGuide ? "#a78bfa" : "rgba(255, 255, 255, 0.45)",
                            border: showControlnetGuide
                                ? "1px solid rgba(167, 139, 250, 0.3)"
                                : "1px solid rgba(255, 255, 255, 0.1)",
                            bgcolor: showControlnetGuide
                                ? "rgba(167, 139, 250, 0.12)"
                                : "rgba(255, 255, 255, 0.04)",
                            "&:hover": {
                                bgcolor: showControlnetGuide
                                    ? "rgba(167, 139, 250, 0.2)"
                                    : "rgba(255, 255, 255, 0.08)",
                                color: showControlnetGuide ? "#a78bfa" : "rgba(255, 255, 255, 0.72)",
                            },
                        }}
                        title="Toggle ControlNet composition guide"
                    >
                        <ControlnetIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                )}

                {onToggleSpatialOverlay && (
                    <IconButton
                        onClick={onToggleSpatialOverlay}
                        size="small"
                        sx={{
                            ...squareButtonSx,
                            color: showSpatialOverlay ? "#34d399" : "rgba(255, 255, 255, 0.45)",
                            border: showSpatialOverlay
                                ? "1px solid rgba(52, 211, 153, 0.3)"
                                : "1px solid rgba(255, 255, 255, 0.1)",
                            bgcolor: showSpatialOverlay
                                ? "rgba(52, 211, 153, 0.12)"
                                : "rgba(255, 255, 255, 0.04)",
                            "&:hover": {
                                bgcolor: showSpatialOverlay
                                    ? "rgba(52, 211, 153, 0.2)"
                                    : "rgba(255, 255, 255, 0.08)",
                                color: showSpatialOverlay ? "#34d399" : "rgba(255, 255, 255, 0.72)",
                            },
                        }}
                        title="Toggle spatial floorplan overlay"
                    >
                        <SpatialIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                )}

                {onToggleSpatialGrid && showSpatialOverlay && (
                    <IconButton
                        onClick={onToggleSpatialGrid}
                        size="small"
                        sx={{
                            ...squareButtonSx,
                            color: showSpatialGrid ? "#34d399" : "rgba(255, 255, 255, 0.45)",
                            border: showSpatialGrid
                                ? "1px solid rgba(52, 211, 153, 0.3)"
                                : "1px solid rgba(255, 255, 255, 0.1)",
                            bgcolor: showSpatialGrid
                                ? "rgba(52, 211, 153, 0.12)"
                                : "rgba(255, 255, 255, 0.04)",
                            "&:hover": {
                                bgcolor: showSpatialGrid
                                    ? "rgba(52, 211, 153, 0.2)"
                                    : "rgba(255, 255, 255, 0.08)",
                                color: showSpatialGrid ? "#34d399" : "rgba(255, 255, 255, 0.72)",
                            },
                        }}
                        title="Toggle rule-of-thirds grid"
                    >
                        <SpatialGridIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
};

export default PlaybackControls;
