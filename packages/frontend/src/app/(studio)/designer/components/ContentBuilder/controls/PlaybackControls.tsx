"use client";

import React from "react";
import { Box, IconButton, Slider, Typography } from "@mui/material";
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
} from "@mui/icons-material";
import { PlaybackState } from "../types/timelineTypes";
import { formatTime } from "../utils";

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
    onSeek,
    onSpeedChange,
    readOnly = false,
}) => {
    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                bgcolor: "rgba(8, 8, 12, 0.9)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
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
                        "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.1)",
                        },
                        "&:disabled": {
                            color: "rgba(255, 255, 255, 0.3)",
                        },
                    }}
                >
                    <StopIcon fontSize="small" />
                </IconButton>

                <IconButton
                    onClick={playbackState.isPlaying ? onPause : onPlay}
                    disabled={readOnly}
                    sx={{
                        color: "rgba(123, 97, 255, 0.9)",
                        bgcolor: "rgba(123, 97, 255, 0.1)",
                        "&:hover": {
                            bgcolor: "rgba(123, 97, 255, 0.2)",
                        },
                        "&:disabled": {
                            color: "rgba(255, 255, 255, 0.3)",
                            bgcolor: "transparent",
                        },
                    }}
                >
                    {playbackState.isPlaying ? (
                        <PauseIcon fontSize="small" />
                    ) : (
                        <PlayIcon fontSize="small" />
                    )}
                </IconButton>
            </Box>

            {/* Timeline Scrubber */}
            <Box sx={{ flex: 1, mx: 2 }}>
                <Slider
                    value={playbackState.currentTime}
                    min={0}
                    max={playbackState.totalDuration || 100}
                    onChange={(_, value) => onSeek(value as number)}
                    disabled={readOnly}
                    size="small"
                    sx={{
                        color: "rgba(123, 97, 255, 0.8)",
                        height: 4,
                        "& .MuiSlider-track": {
                            bgcolor: "rgba(123, 97, 255, 0.8)",
                            border: "none",
                        },
                        "& .MuiSlider-rail": {
                            bgcolor: "rgba(255, 255, 255, 0.2)",
                        },
                        "& .MuiSlider-thumb": {
                            bgcolor: "rgba(123, 97, 255, 0.9)",
                            width: 12,
                            height: 12,
                            "&:hover": {
                                boxShadow: "0 0 0 8px rgba(123, 97, 255, 0.16)",
                            },
                        },
                    }}
                />
            </Box>

            {/* Time Display */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        minWidth: 60,
                    }}
                >
                    {formatTime(playbackState.currentTime)}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "0.75rem",
                    }}
                >
                    /
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        minWidth: 60,
                    }}
                >
                    {formatTime(playbackState.totalDuration)}
                </Typography>
            </Box>

            {/* Speed Control */}
            {onSpeedChange && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255, 255, 255, 0.6)",
                            fontSize: "0.7rem",
                        }}
                    >
                        Speed:
                    </Typography>
                    <select
                        value={playbackState.playbackSpeed}
                        onChange={(e) => onSpeedChange(Number(e.target.value))}
                        disabled={readOnly}
                        style={{
                            backgroundColor: "rgba(8, 8, 12, 0.9)",
                            color: "rgba(255, 255, 255, 0.8)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: "0.7rem",
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
