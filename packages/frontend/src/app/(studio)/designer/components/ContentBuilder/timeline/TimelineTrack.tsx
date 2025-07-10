"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
    Videocam as VideoIcon,
    VolumeUp as AudioIcon,
    Palette as GraphicsIcon,
    MusicNote as MusicIcon,
} from "@mui/icons-material";
import { useDroppable } from "@dnd-kit/core";
import { TimelineTrack as TimelineTrackType } from "../types/timelineTypes";
import { ViewState } from "../types/dragDropTypes";
import { DragState } from "../types/dragDropTypes";
import { getSceneIconComponent } from "../utils";

interface TimelineTrackProps {
    track: TimelineTrackType;
    trackPosition: number;
    isValidDropTarget: boolean;
    viewState: ViewState;
    dragState: DragState;
    children: React.ReactNode;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
    track,
    trackPosition,
    isValidDropTarget,
    viewState,
    children,
}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `timeline-track-${track.id}`,
        data: {
            type: 'timeline-track',
            trackId: track.id,
            trackType: track.track_type,
        },
    });

    const getTrackIcon = (trackType: string) => {
        const iconComponents = {
            VideoIcon,
            AudioIcon,
            GraphicsIcon,
            MusicIcon,
        };
        return getSceneIconComponent(trackType.toUpperCase(), iconComponents);
    };

    return (
        <Box
            ref={setNodeRef}
            sx={{
                position: "absolute",
                width: "100%",
                height: 40,
                top: trackPosition,
                left: 0,
                right: 0,
            }}
        >
            {/* Track background */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                    bgcolor: track.visible
                        ? (isValidDropTarget || isOver)
                            ? `${track.color}40` // Much brighter for valid drop target or hover
                            : `${track.color}25` // Enhanced brightness for normal state
                        : "transparent",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    transition: "background-color 0.2s ease-in-out",
                    ...(isOver && {
                        bgcolor: `${track.color}60`, // Even brighter when hovering over
                        boxShadow: `inset 0 0 0 2px ${track.color}80`,
                    }),
                }}
            />

            {/* Floating Track Header */}
            <Box
                sx={{
                    position: "absolute",
                    top: 8,
                    left: viewState.viewportLeft + 8, // Compensate for viewport offset to stay visible
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    zIndex: 200, // Higher z-index to float above everything
                    transition: "left 0.1s ease-out", // Smooth movement with viewport
                    "&:hover .track-text": {
                        opacity: 1,
                        transform: "translateX(0)",
                    },
                }}
            >
                {/* Track Icon with Dark Background */}
                <Box
                    sx={{
                        p: 0.5,
                        borderRadius: 0.75,
                        bgcolor: "rgba(0, 0, 0, 0.7)", // Darker background for better contrast
                        color: track.color, // Icon takes the track color
                        display: "flex",
                        alignItems: "center",
                        width: 24,
                        height: 24,
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.6)", // Enhanced shadow for floating effect
                        border: `1px solid ${track.color}50`, // Brighter border using track color
                        backdropFilter: "blur(4px)", // Add backdrop blur for modern glass effect
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                            transform: "scale(1.1)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.7)",
                            bgcolor: "rgba(0, 0, 0, 0.85)", // Even darker on hover for contrast
                            border: `1px solid ${track.color}80`, // Much more prominent border on hover
                        },
                    }}
                >
                    {getTrackIcon(track.track_type)}
                </Box>

                {/* Track Text - Only Visible on Hover */}
                <Typography
                    variant="body2"
                    className="track-text"
                    sx={{
                        fontWeight: 500,
                        fontSize: "0.75rem",
                        color: "#fff",
                        ml: 0.75,
                        opacity: 0,
                        transform: "translateX(-10px)",
                        transition: "all 0.2s ease-in-out",
                        bgcolor: "rgba(0,0,0,0.9)",
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                        border: `1px solid ${track.color}40`,
                        whiteSpace: "nowrap",
                        pointerEvents: "none", // Prevent text from interfering with hover
                    }}
                >
                    {track.name}
                </Typography>
            </Box>

            {children}
        </Box>
    );
};

export default TimelineTrack;
