"use client";

import React from "react";
import { Box } from "@mui/material";
import { PlaybackState } from "@/features/content/content-builder/types/timeline";
import { ViewState } from "@/features/content/content-builder/types/timeline";

interface TimelinePlayheadProps {
    playbackState: PlaybackState;
    viewState: ViewState;
    totalTracksHeight: number;
    onTimelineClick?: (time: number) => void;
    readOnly?: boolean;
    scrollToTime?: (time: number, totalDuration?: number) => void;
}

const Playhead: React.FC<TimelinePlayheadProps> = ({
    playbackState,
    viewState,
    totalTracksHeight,
    onTimelineClick,
    readOnly = false,
    scrollToTime,
}) => {
    const [isDragging, setIsDragging] = React.useState(false);

    // Auto-scroll timeline to follow playhead using viewport transform
    const autoScrollToPlayhead = React.useCallback(() => {
        if (!scrollToTime) return;

        const playheadPosition = playbackState.currentTime * viewState.zoomLevel;
        const viewportLeft = viewState.viewportLeft;
        const viewportRight = viewportLeft + viewState.viewportWidth;

        // Smaller buffer zone for more centered scrolling
        const bufferZone = viewState.viewportWidth * 0.25; // 25% of viewport width

        // Calculate center position preference
        const idealCenterPosition = viewportLeft + (viewState.viewportWidth / 2);
        const distanceFromCenter = Math.abs(playheadPosition - idealCenterPosition);

        // Check if playhead is outside visible area or too far from center
        const needsScrollLeft = playheadPosition < viewportLeft + bufferZone;
        const needsScrollRight = playheadPosition > viewportRight - bufferZone;
        const needsCentering = distanceFromCenter > viewState.viewportWidth * 0.3; // Re-center if more than 30% off

        if (needsScrollLeft || needsScrollRight || (needsCentering && !isDragging)) {
            // Pass total duration for better end-of-timeline handling
            scrollToTime(playbackState.currentTime, playbackState.totalDuration);
        }
    }, [
        playbackState.currentTime,
        playbackState.totalDuration,
        viewState.zoomLevel,
        viewState.viewportLeft,
        viewState.viewportWidth,
        scrollToTime,
        isDragging
    ]);

    // Auto-scroll when playhead position changes (during playback or dragging)
    React.useEffect(() => {
        autoScrollToPlayhead();
    }, [autoScrollToPlayhead]);

    // Enhanced mouse move handler with auto-scroll during dragging
    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isDragging || !onTimelineClick) return;

        // Calculate mouse position relative to the viewport
        const timelineElement = document.querySelector('[data-timeline-container]') as HTMLElement;
        if (!timelineElement) return;

        const rect = timelineElement.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;

        // Convert to actual timeline position by accounting for viewport offset
        const timelineX = relativeX + viewState.viewportLeft;
        const newTime = Math.max(0, timelineX / viewState.zoomLevel);

        onTimelineClick(newTime);

        // Auto-scroll during dragging for smoother experience
        requestAnimationFrame(() => {
            autoScrollToPlayhead();
        });
    }, [isDragging, onTimelineClick, viewState.zoomLevel, viewState.viewportLeft, autoScrollToPlayhead]);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
        if (readOnly || !onTimelineClick) return;

        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, [readOnly, onTimelineClick]);

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add global mouse move and mouse up listeners when dragging
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);
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
                pointerEvents: readOnly ? "none" : "auto",
                cursor: !readOnly && onTimelineClick ? "grab" : "default",
                "&:active": {
                    cursor: !readOnly && onTimelineClick ? "grabbing" : "default",
                },
            }}
            onMouseDown={handleMouseDown}
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
                    pointerEvents: readOnly ? "none" : "auto",
                    cursor: !readOnly && onTimelineClick ? "grab" : "default",
                    "&:active": {
                        cursor: !readOnly && onTimelineClick ? "grabbing" : "default",
                    },
                }}
                onMouseDown={handleMouseDown}
            />
            {/* Draggable handle area for better UX */}
            <Box
                sx={{
                    position: "absolute",
                    left: -8,
                    top: -8,
                    width: 16,
                    height: totalTracksHeight + 16,
                    cursor: !readOnly && onTimelineClick ? "grab" : "default",
                    "&:active": {
                        cursor: !readOnly && onTimelineClick ? "grabbing" : "default",
                    },
                    // Invisible but provides larger click target
                    backgroundColor: "transparent",
                }}
                onMouseDown={handleMouseDown}
            />
        </Box>
    );
};

export default Playhead;
