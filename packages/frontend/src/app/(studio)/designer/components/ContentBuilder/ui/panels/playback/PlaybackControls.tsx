"use client";

import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
} from "@mui/icons-material";
import { PlaybackState } from "@/lib/types/timeline";
import { formatTime } from "@/lib/utils/formatUtils";

interface PlaybackControlsProps {
    playbackState: PlaybackState;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    onSpeedChange?: (speed: number) => void;
    readOnly?: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    playbackState,
    onPlay,
    onPause,
    onStop,
    onSeek, // eslint-disable-line @typescript-eslint/no-unused-vars
    onSpeedChange,
    readOnly = false,
}) => {
    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                // Remove background styling - handled by parent container
            }}
        >
            {/* Playback Buttons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                    onClick={onStop}
                    disabled={readOnly}
                    size="small"
                    sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        width: "36px",
                        height: "36px",
                        borderRadius: 1.5,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        bgcolor: "rgba(255, 255, 255, 0.05)",
                        "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.1)",
                            borderColor: "rgba(255, 255, 255, 0.2)",
                        },
                        "&:disabled": {
                            color: "rgba(255, 255, 255, 0.3)",
                            bgcolor: "rgba(255, 255, 255, 0.02)",
                        },
                    }}
                >
                    <StopIcon fontSize="small" />
                </IconButton>

                <IconButton
                    onClick={playbackState.isPlaying ? onPause : onPlay}
                    disabled={readOnly}
                    sx={{
                        color: playbackState.isPlaying ? "rgba(255, 255, 255, 0.9)" : "rgba(123, 97, 255, 0.9)",
                        bgcolor: playbackState.isPlaying ? "rgba(244, 67, 54, 0.15)" : "rgba(123, 97, 255, 0.15)",
                        width: "40px",
                        height: "40px",
                        borderRadius: 1.5,
                        border: playbackState.isPlaying
                            ? "1px solid rgba(244, 67, 54, 0.3)"
                            : "1px solid rgba(123, 97, 255, 0.3)",
                        "&:hover": {
                            bgcolor: playbackState.isPlaying ? "rgba(244, 67, 54, 0.25)" : "rgba(123, 97, 255, 0.25)",
                            borderColor: playbackState.isPlaying
                                ? "rgba(244, 67, 54, 0.5)"
                                : "rgba(123, 97, 255, 0.5)",
                        },
                        "&:disabled": {
                            color: "rgba(255, 255, 255, 0.3)",
                            bgcolor: "rgba(255, 255, 255, 0.02)",
                            borderColor: "rgba(255, 255, 255, 0.1)",
                        },
                    }}
                >
                    {playbackState.isPlaying ? (
                        <PauseIcon fontSize="medium" />
                    ) : (
                        <PlayIcon fontSize="medium" />
                    )}
                </IconButton>
            </Box>

            {/* Time Display */}
            <Box sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                bgcolor: "rgba(0, 0, 0, 0.3)",
                borderRadius: 1,
                border: "1px solid rgba(255, 255, 255, 0.05)",
            }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        fontWeight: 500,
                        minWidth: 48,
                    }}
                >
                    {formatTime(playbackState.currentTime)}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.4)",
                        fontSize: "0.75rem",
                        mx: 0.5,
                    }}
                >
                    /
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        fontWeight: 500,
                        minWidth: 48,
                    }}
                >
                    {formatTime(playbackState.totalDuration)}
                </Typography>
            </Box>

            {/* Speed Control */}
            {onSpeedChange && (
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.5,
                    py: 0.5,
                    bgcolor: "rgba(0, 0, 0, 0.3)",
                    borderRadius: 1,
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255, 255, 255, 0.7)",
                            fontSize: "0.7rem",
                            fontWeight: 500,
                        }}
                    >
                        Speed:
                    </Typography>
                    <select
                        value={playbackState.playbackSpeed}
                        onChange={(e) => onSpeedChange(Number(e.target.value))}
                        disabled={readOnly}
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.4)",
                            color: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            borderRadius: 4,
                            padding: "3px 8px",
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            height: "24px",
                            minWidth: "50px",
                            outline: "none",
                        }}
                    >
                        {speedOptions.map(speed => (
                            <option key={speed} value={speed}>
                                {speed}x
                            </option>
                        ))}
                    </select>
                </Box>
            )}
        </Box>
    );
};

export default PlaybackControls;
