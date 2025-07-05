"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Save as SaveIcon,
  FileDownload as ExportIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  ZoomOutMap as ZoomOutMapIcon,
} from "@mui/icons-material";
import { PlaybackState, ViewState } from "./ContentBuilderTypes";

interface ContentBuilderControlsProps {
  playbackState: PlaybackState;
  viewState: ViewState;
  onPlay: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onTimelineClick: (time: number) => void;
  onZoomChange: (zoom: number) => void;
  onSave?: () => void;
  onExport?: () => void;
  onJumpToStart?: () => void;
  onJumpToEnd?: () => void;
  onZoomToFit?: () => void;
  readOnly?: boolean;
}

const ContentBuilderControls: React.FC<ContentBuilderControlsProps> = ({
  playbackState,
  viewState,
  onPlay,
  onStop,
  onSpeedChange,
  onTimelineClick,
  onZoomChange,
  onSave,
  onExport,
  onJumpToStart,
  onJumpToEnd,
  onZoomToFit,
  readOnly = false,
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const playbackSpeeds = [0.25, 0.5, 1, 1.5, 2];

  return (
    <Box
      sx={{
        mb: 1.5, // Reduced margin
        bgcolor: "rgba(18, 18, 18, 0.95)", // Dark, modern background
        borderRadius: 2,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
      }}
    >
      {/* Compact Single Row Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1, // Reduced padding for compactness
          gap: 3,
          minHeight: 60, // Increased height to accommodate value label
        }}
      >
        {/* Left: Playback Controls */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title={playbackState.isPlaying ? "Pause" : "Play"}>
            <IconButton
              onClick={onPlay}
              sx={{
                color: "#fff",
                bgcolor: "rgba(25, 118, 210, 0.15)",
                border: "1px solid rgba(25, 118, 210, 0.3)",
                width: 36,
                height: 36,
                "&:hover": {
                  bgcolor: "rgba(25, 118, 210, 0.25)",
                  border: "1px solid rgba(25, 118, 210, 0.5)",
                },
              }}
            >
              {playbackState.isPlaying ? (
                <PauseIcon fontSize="small" />
              ) : (
                <PlayIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Stop">
            <IconButton
              onClick={onStop}
              sx={{
                color: "#ccc",
                width: 32,
                height: 32,
                "&:hover": {
                  color: "#fff",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              <StopIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Navigation Controls */}
          {onJumpToStart && (
            <Tooltip title="Jump to Start">
              <IconButton
                onClick={onJumpToStart}
                sx={{
                  color: "#888",
                  width: 28,
                  height: 28,
                  "&:hover": {
                    color: "#fff",
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                <SkipPreviousIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {onJumpToEnd && (
            <Tooltip title="Jump to End">
              <IconButton
                onClick={onJumpToEnd}
                sx={{
                  color: "#888",
                  width: 28,
                  height: 28,
                  "&:hover": {
                    color: "#fff",
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                <SkipNextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Speed Control - Compact */}
          <FormControl
            size="small"
            sx={{
              minWidth: 70,
              ml: 1,
              "& .MuiInputLabel-root": {
                color: "#888",
                fontSize: "0.75rem",
              },
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ccc",
                height: 32,
                "& fieldset": { border: "none" },
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                },
              },
              "& .MuiSelect-select": {
                fontSize: "0.75rem",
                py: 0.5,
              },
            }}
          >
            <InputLabel>Speed</InputLabel>
            <Select
              value={playbackState.playbackSpeed}
              label="Speed"
              onChange={(e) => onSpeedChange(Number(e.target.value))}
            >
              {playbackSpeeds.map((speed) => (
                <MenuItem
                  key={speed}
                  value={speed}
                  sx={{ fontSize: "0.75rem" }}
                >
                  {speed}x
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Center: Time Display & Scrubber */}
        <Box
          sx={{ flex: 1, mx: 3, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: "monospace",
              color: "#aaa",
              fontSize: "0.75rem",
              minWidth: 80,
              textAlign: "center",
            }}
          >
            {formatTime(playbackState.currentTime)} /{" "}
            {formatTime(playbackState.totalDuration)}
          </Typography>

          {/* Timeline Scrubber - Inline and Compact */}
          <Box sx={{ flex: 1, py: 0.5 }}>
            {" "}
            {/* Reduced padding since no value label */}
            <Slider
              value={playbackState.currentTime}
              min={0}
              max={playbackState.totalDuration}
              onChange={(_, value) =>
                onTimelineClick(Array.isArray(value) ? value[0] : value)
              }
              sx={{
                color: "rgba(25, 118, 210, 0.8)", // Dimmer blue for dark theme
                height: 4,
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  bgcolor: "#1976d2",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    boxShadow: "0 0 0 8px rgba(25, 118, 210, 0.16)",
                  },
                  "&:before": {
                    display: "none",
                  },
                },
                "& .MuiSlider-track": {
                  height: 3,
                  border: "none",
                  bgcolor: "rgba(25, 118, 210, 0.6)", // Dimmer track
                },
                "& .MuiSlider-rail": {
                  height: 3,
                  bgcolor: "rgba(255, 255, 255, 0.08)", // Very subtle rail
                  opacity: 1,
                },
              }}
            />
          </Box>
        </Box>

        {/* Right: Zoom & Action Controls */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          {/* Zoom Controls - Compact */}
          <Tooltip title="Zoom Out">
            <IconButton
              onClick={() => onZoomChange(Math.max(5, viewState.zoomLevel - 5))}
              sx={{
                color: "#888",
                width: 28,
                height: 28,
                "&:hover": {
                  color: "#fff",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography
            variant="caption"
            sx={{
              minWidth: 40,
              textAlign: "center",
              color: "#aaa",
              fontSize: "0.7rem",
            }}
          >
            {Math.round((viewState.zoomLevel / 10) * 100)}%
          </Typography>

          <Tooltip title="Zoom In">
            <IconButton
              onClick={() =>
                onZoomChange(Math.min(50, viewState.zoomLevel + 5))
              }
              sx={{
                color: "#888",
                width: 28,
                height: 28,
                "&:hover": {
                  color: "#fff",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {onZoomToFit && (
            <Tooltip title="Zoom to Fit">
              <IconButton
                onClick={onZoomToFit}
                sx={{
                  color: "#888",
                  width: 28,
                  height: 28,
                  ml: 0.5,
                  "&:hover": {
                    color: "#fff",
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                <ZoomOutMapIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Action Buttons - Compact */}
          {!readOnly && (
            <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
              {onSave && (
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon fontSize="small" />}
                  onClick={onSave}
                  size="small"
                  sx={{
                    minWidth: 70,
                    height: 32,
                    fontSize: "0.7rem",
                    border: "1px solid rgba(76, 175, 80, 0.3)",
                    color: "#66bb6a",
                    "&:hover": {
                      border: "1px solid rgba(76, 175, 80, 0.5)",
                      bgcolor: "rgba(76, 175, 80, 0.08)",
                    },
                  }}
                >
                  Save
                </Button>
              )}
              {onExport && (
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon fontSize="small" />}
                  onClick={onExport}
                  size="small"
                  sx={{
                    minWidth: 76,
                    height: 32,
                    fontSize: "0.7rem",
                    border: "1px solid rgba(156, 39, 176, 0.3)",
                    color: "#ba68c8",
                    "&:hover": {
                      border: "1px solid rgba(156, 39, 176, 0.5)",
                      bgcolor: "rgba(156, 39, 176, 0.08)",
                    },
                  }}
                >
                  Export
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default ContentBuilderControls;
