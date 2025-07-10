"use client";

import React from "react";
import { Box } from "@mui/material";
import { PlaybackState } from "../types/timelineTypes";
import { ViewState } from "../types/dragDropTypes";

interface TimelinePlayheadProps {
    playbackState: PlaybackState;
    viewState: ViewState;
    totalTracksHeight: number;
}

const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({
    playbackState,
    viewState,
    totalTracksHeight,
}) => {
    return (
        <Box
            sx={{
                position: "absolute",
                left: playbackState.currentTime * viewState.zoomLevel,
                top: 0,
                height: totalTracksHeight,
                width: 2,
                bgcolor: "error.main",
                zIndex: 1000,
                pointerEvents: "none",
            }}
        >
            {/* Playhead triangle indicator at top */}
            <Box
                sx={{
                    position: "absolute",
                    top: -8,
                    left: -6,
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "8px solid",
                    borderBottomColor: "error.main",
                }}
            />
        </Box>
    );
};

export default TimelinePlayhead;
