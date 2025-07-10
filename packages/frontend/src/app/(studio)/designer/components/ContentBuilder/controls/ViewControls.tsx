"use client";

import React from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import {
    ViewList as ListViewIcon,
    ViewModule as GridViewIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
} from "@mui/icons-material";

interface ViewControlsProps {
    viewMode: "list" | "grid";
    onViewModeChange: (mode: "list" | "grid") => void;
    isFullscreen?: boolean;
    onFullscreenToggle?: () => void;
    readOnly?: boolean;
}

const ViewControls: React.FC<ViewControlsProps> = ({
    viewMode,
    onViewModeChange,
    isFullscreen = false,
    onFullscreenToggle,
    readOnly = false,
}) => {
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
            <Typography
                variant="caption"
                sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.75rem",
                }}
            >
                View:
            </Typography>

            {/* View Mode Toggle */}
            <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
                size="small"
                disabled={readOnly}
                sx={{
                    "& .MuiToggleButton-root": {
                        color: "rgba(255, 255, 255, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "&.Mui-selected": {
                            bgcolor: "rgba(123, 97, 255, 0.3)",
                            color: "rgba(123, 97, 255, 0.9)",
                            border: "1px solid rgba(123, 97, 255, 0.5)",
                        },
                        "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.1)",
                        },
                    },
                }}
            >
                <ToggleButton value="list" aria-label="list view">
                    <ListViewIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
                    <GridViewIcon fontSize="small" />
                </ToggleButton>
            </ToggleButtonGroup>

            {/* Fullscreen Toggle */}
            {onFullscreenToggle && (
                <ToggleButton
                    value="fullscreen"
                    selected={isFullscreen}
                    onChange={onFullscreenToggle}
                    disabled={readOnly}
                    size="small"
                    sx={{
                        color: isFullscreen
                            ? "rgba(123, 97, 255, 0.9)"
                            : "rgba(255, 255, 255, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        bgcolor: isFullscreen
                            ? "rgba(123, 97, 255, 0.3)"
                            : "transparent",
                        "&:hover": {
                            bgcolor: isFullscreen
                                ? "rgba(123, 97, 255, 0.4)"
                                : "rgba(255, 255, 255, 0.1)",
                        },
                    }}
                >
                    {isFullscreen ? (
                        <FullscreenExitIcon fontSize="small" />
                    ) : (
                        <FullscreenIcon fontSize="small" />
                    )}
                </ToggleButton>
            )}
        </Box>
    );
};

export default ViewControls;
