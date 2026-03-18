"use client";

import React from "react";
import { Box, Typography, Select, MenuItem, FormControl } from "@mui/material";
import { formatTime } from "@/lib/utils/formatUtils";
import { TimelineScene } from "@/lib/types/timeline";

interface GridProps {
    scenes: TimelineScene[];
    effectiveTimelineDuration: number;
    viewState: { zoomLevel: number };
    snapInterval: number;
    onSnapIntervalChange: (interval: number) => void;
}

const Grid: React.FC<GridProps> = ({
    scenes,
    effectiveTimelineDuration,
    viewState,
    snapInterval,
    onSnapIntervalChange,
}) => {
    return (
        <Box
            sx={{
                px: 2,
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "transparent",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                minHeight: 32,
                flexShrink: 0,
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    fontSize: "0.7rem",
                    color: "rgba(255, 255, 255, 0.7)",
                }}
            >
                {scenes.length} scenes • {formatTime(effectiveTimelineDuration)} •{" "}
                {Math.round((viewState.zoomLevel / 10) * 100)}% zoom
            </Typography>

            {/* Snap Interval Dropdown */}
            <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                    value={snapInterval}
                    onChange={(e) => onSnapIntervalChange(Number(e.target.value))}
                    variant="outlined"
                    sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255, 255, 255, 0.15)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255, 255, 255, 0.25)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255, 255, 255, 0.35)",
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
                                    fontSize: "0.65rem",
                                    color: "rgba(255, 255, 255, 0.8)",
                                    "&:hover": {
                                        bgcolor: "rgba(255, 255, 255, 0.1)",
                                    },
                                },
                            },
                        },
                    }}
                >
                    <MenuItem value={0}>No Snap</MenuItem>
                    <MenuItem value={1}>1s</MenuItem>
                    <MenuItem value={5}>5s</MenuItem>
                    <MenuItem value={10}>10s</MenuItem>
                    <MenuItem value={15}>15s</MenuItem>
                    <MenuItem value={60}>60s</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};

export default Grid;
