"use client";

import React from "react";
import { Box } from "@mui/material";
import { ViewState } from "../types/dragDropTypes";

interface TimelineSnapGridProps {
    viewState: ViewState;
    snapInterval: number;
    effectiveTimelineDuration: number;
    totalTracksHeight: number;
}

const TimelineSnapGrid: React.FC<TimelineSnapGridProps> = ({
    viewState,
    snapInterval,
    effectiveTimelineDuration,
    totalTracksHeight,
}) => {
    const getTimeReferenceLines = () => {
        const lines: React.ReactElement[] = [];

        // Skip rendering lines if no snap is selected
        if (snapInterval === 0) {
            return lines;
        }

        // Generate lines based on the selected snap interval
        const interval = snapInterval;

        // Use the same effective timeline duration calculation as the main timeline
        const maxTime = Math.ceil(effectiveTimelineDuration / interval) * interval;

        for (let time = interval; time <= maxTime; time += interval) {
            const xPosition = time * viewState.zoomLevel;

            // Only render lines that are within the visible timeline area
            if (xPosition > 0 && xPosition <= effectiveTimelineDuration * viewState.zoomLevel) {
                lines.push(
                    <Box
                        key={`time-ref-${time}`}
                        sx={{
                            position: "absolute",
                            left: xPosition,
                            top: 0,
                            height: totalTracksHeight,
                            width: "1px",
                            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                            zIndex: 50,
                            pointerEvents: "none",
                        }}
                    />
                );
            }
        }

        return lines;
    };

    return <>{getTimeReferenceLines()}</>;
};

export default TimelineSnapGrid;
