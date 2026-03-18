"use client";

import React from "react";
import { Box, IconButton, Slider, Typography, Tooltip, Select, MenuItem, FormControl } from "@mui/material";
import {
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    CenterFocusStrong as FitIcon,
    Grid3x3 as GridIcon,
} from "@mui/icons-material";
import { ViewState } from "@/lib/types/timeline";
import { formatTime } from "@/lib/utils/formatUtils";
import { TIMELINE_CONFIG } from "../../../../config/constants";

interface TimelineBottomControlsProps {
    viewState: ViewState;
    onZoomChange: (zoom: number) => void;
    onSnapToggle: () => void;
    onFitToView?: () => void;
    snapInterval: number;
    onSnapIntervalChange: (interval: number) => void;
    effectiveTimelineDuration: number;
    sceneCount: number;
    readOnly?: boolean;
}

const Toolbar: React.FC<TimelineBottomControlsProps> = ({
    viewState,
    onZoomChange,
    onSnapToggle,
    onFitToView,
    snapInterval,
    onSnapIntervalChange,
    effectiveTimelineDuration,
    sceneCount,
    readOnly = false,
}) => {
    const minZoom = TIMELINE_CONFIG.MIN_ZOOM_LEVEL;
    const maxZoom = TIMELINE_CONFIG.MAX_ZOOM_LEVEL;
    const safeZoomLevel = Number.isFinite(viewState.zoomLevel) ? viewState.zoomLevel : minZoom;

    const handleZoomIn = () => {
        const newZoom = Math.min(maxZoom, safeZoomLevel * 1.2);
        onZoomChange(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(minZoom, safeZoomLevel / 1.2);
        onZoomChange(newZoom);
    };

    const zoomPercentage = Math.round((safeZoomLevel / 10) * 100);

    return (
        <Box
            sx={{
                px: 2,
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "rgba(8, 8, 12, 0.7)",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                minHeight: 40,
                flexShrink: 0,
                gap: 2,
            }}
        >
            {/* Left side - Timeline info */}
            <Typography
                variant="caption"
                sx={{
                    fontSize: "0.7rem",
                    color: "rgba(255, 255, 255, 0.7)",
                    flexShrink: 0,
                }}
            >
                {sceneCount} scenes • {formatTime(effectiveTimelineDuration)}
            </Typography>

            {/* Center - Zoom and Snap Controls */}
            <Box sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: 1,
                justifyContent: "center",
                maxWidth: 400,
            }}>
                {/* Zoom Out */}
                <Tooltip title="Zoom Out">
                    <IconButton
                        onClick={handleZoomOut}
                        disabled={readOnly || safeZoomLevel <= minZoom}
                        size="small"
                        sx={{
                            color: "rgba(255, 255, 255, 0.8)",
                            width: 28,
                            height: 28,
                            "&:hover": {
                                bgcolor: "rgba(255, 255, 255, 0.1)",
                            },
                            "&:disabled": {
                                color: "rgba(255, 255, 255, 0.3)",
                            },
                        }}
                    >
                        <ZoomOutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {/* Zoom Slider */}
                <Box sx={{ flex: 1, mx: 1, maxWidth: 120 }}>
                    <Slider
                        value={safeZoomLevel}
                        min={minZoom}
                        max={maxZoom}
                        onChange={(_, value) => {
                            const newZoom = value as number;
                            console.log(`🎚️ [ZOOM-SLIDER] User dragged zoom slider to:`, { 
                                value: newZoom,
                                min: minZoom,
                                max: maxZoom
                            });
                            onZoomChange(newZoom);
                        }}
                        disabled={readOnly}
                        size="small"
                        sx={{
                            color: "rgba(123, 97, 255, 0.8)",
                            height: 3,
                            "& .MuiSlider-track": {
                                bgcolor: "rgba(123, 97, 255, 0.8)",
                                border: "none",
                            },
                            "& .MuiSlider-rail": {
                                bgcolor: "rgba(255, 255, 255, 0.2)",
                            },
                            "& .MuiSlider-thumb": {
                                bgcolor: "rgba(123, 97, 255, 0.9)",
                                width: 10,
                                height: 10,
                                "&:hover": {
                                    boxShadow: "0 0 0 6px rgba(123, 97, 255, 0.16)",
                                },
                            },
                        }}
                    />
                </Box>

                {/* Zoom In */}
                <Tooltip title="Zoom In">
                    <IconButton
                        onClick={handleZoomIn}
                        disabled={readOnly || safeZoomLevel >= maxZoom}
                        size="small"
                        sx={{
                            color: "rgba(255, 255, 255, 0.8)",
                            width: 28,
                            height: 28,
                            "&:hover": {
                                bgcolor: "rgba(255, 255, 255, 0.1)",
                            },
                            "&:disabled": {
                                color: "rgba(255, 255, 255, 0.3)",
                            },
                        }}
                    >
                        <ZoomInIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {/* Fit to View */}
                {onFitToView && (
                    <Tooltip title="Fit to View">
                        <IconButton
                            onClick={onFitToView}
                            disabled={readOnly}
                            size="small"
                            sx={{
                                color: "rgba(255, 255, 255, 0.8)",
                                width: 28,
                                height: 28,
                                "&:hover": {
                                    bgcolor: "rgba(255, 255, 255, 0.1)",
                                },
                                "&:disabled": {
                                    color: "rgba(255, 255, 255, 0.3)",
                                },
                            }}
                        >
                            <FitIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}

                {/* Zoom Percentage */}
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.7rem",
                        minWidth: 35,
                        textAlign: "center",
                    }}
                >
                    {zoomPercentage}%
                </Typography>

                {/* Snap to Grid Toggle */}
                <Tooltip title={`Snap to Grid ${viewState.snapToGrid ? 'On' : 'Off'}`}>
                    <IconButton
                        onClick={onSnapToggle}
                        disabled={readOnly}
                        size="small"
                        sx={{
                            color: viewState.snapToGrid
                                ? "rgba(123, 97, 255, 0.9)"
                                : "rgba(255, 255, 255, 0.5)",
                            bgcolor: viewState.snapToGrid
                                ? "rgba(123, 97, 255, 0.2)"
                                : "transparent",
                            width: 28,
                            height: 28,
                            "&:hover": {
                                bgcolor: viewState.snapToGrid
                                    ? "rgba(123, 97, 255, 0.3)"
                                    : "rgba(255, 255, 255, 0.1)",
                            },
                            "&:disabled": {
                                color: "rgba(255, 255, 255, 0.3)",
                                bgcolor: "transparent",
                            },
                        }}
                    >
                        <GridIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Right side - Snap interval dropdown */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "0.7rem",
                    }}
                >
                    Snap:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 70 }}>
                    <Select
                        value={snapInterval}
                        onChange={(e) => onSnapIntervalChange(Number(e.target.value))}
                        variant="outlined"
                        disabled={readOnly}
                        sx={{
                            height: 28,
                            fontSize: "0.7rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.15)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.25)",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(123, 97, 255, 0.5)",
                            },
                            "& .MuiSelect-icon": {
                                color: "rgba(255, 255, 255, 0.8)",
                            },
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    bgcolor: "rgba(8, 8, 12, 0.95)",
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    "& .MuiMenuItem-root": {
                                        fontSize: "0.7rem",
                                        color: "rgba(255, 255, 255, 0.8)",
                                        "&:hover": {
                                            bgcolor: "rgba(255, 255, 255, 0.1)",
                                        },
                                    },
                                },
                            },
                        }}
                    >
                        <MenuItem value={0}>Off</MenuItem>
                        <MenuItem value={1}>1s</MenuItem>
                        <MenuItem value={5}>5s</MenuItem>
                        <MenuItem value={10}>10s</MenuItem>
                        <MenuItem value={15}>15s</MenuItem>
                        <MenuItem value={60}>60s</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};

export default Toolbar;
