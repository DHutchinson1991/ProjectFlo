"use client";

import React from "react";
import { Box, IconButton, Slider, Typography, Tooltip } from "@mui/material";
import {
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    CenterFocusStrong as FitIcon,
    Grid3x3 as GridIcon,
} from "@mui/icons-material";
import { ViewState } from "../types/dragDropTypes";

interface TimelineControlsProps {
    viewState: ViewState;
    onZoomChange: (zoom: number) => void;
    onSnapToggle: () => void;
    onFitToView?: () => void;
    readOnly?: boolean;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
    viewState,
    onZoomChange,
    onSnapToggle,
    onFitToView,
    readOnly = false,
}) => {
    const minZoom = 1; // 1 pixel per second (allows zooming out much further)
    const maxZoom = 100; // 100 pixels per second (allows zooming in further too)

    const handleZoomIn = () => {
        const newZoom = Math.min(maxZoom, viewState.zoomLevel * 1.2);
        onZoomChange(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(minZoom, viewState.zoomLevel / 1.2);
        onZoomChange(newZoom);
    };

    const zoomPercentage = Math.round((viewState.zoomLevel / 10) * 100);

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
            {/* Zoom Controls */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Tooltip title="Zoom Out">
                    <IconButton
                        onClick={handleZoomOut}
                        disabled={readOnly || viewState.zoomLevel <= minZoom}
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
                        <ZoomOutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Zoom In">
                    <IconButton
                        onClick={handleZoomIn}
                        disabled={readOnly || viewState.zoomLevel >= maxZoom}
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
                        <ZoomInIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {onFitToView && (
                    <Tooltip title="Fit to View">
                        <IconButton
                            onClick={onFitToView}
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
                            <FitIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Zoom Slider */}
            <Box sx={{ flex: 1, mx: 2, maxWidth: 200 }}>
                <Slider
                    value={viewState.zoomLevel}
                    min={minZoom}
                    max={maxZoom}
                    onChange={(_, value) => onZoomChange(value as number)}
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

            {/* Zoom Percentage */}
            <Typography
                variant="caption"
                sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.75rem",
                    minWidth: 50,
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

            {/* Grid Size Display */}
            {viewState.snapToGrid && (
                <Typography
                    variant="caption"
                    sx={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "0.7rem",
                    }}
                >
                    {viewState.gridSize}s
                </Typography>
            )}
        </Box>
    );
};

export default TimelineControls;
