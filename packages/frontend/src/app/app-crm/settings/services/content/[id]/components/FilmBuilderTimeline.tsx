"use client";

import React from "react";
import {
    Box,
    Typography,
    Tooltip,
    Chip,
} from "@mui/material";
import {
    Lock as LockIcon,
    Videocam as VideoIcon,
    VolumeUp as AudioIcon,
    Palette as GraphicsIcon,
    MusicNote as MusicIcon,
} from "@mui/icons-material";
import {
    TimelineComponent,
    TimelineTrack,
    PlaybackState,
    ViewState,
    DragState
} from "./FilmBuilderTypes";

interface FilmBuilderTimelineProps {
    components: TimelineComponent[];
    tracks: TimelineTrack[];
    playbackState: PlaybackState;
    viewState: ViewState;
    dragState: DragState;
    timelineRef: React.RefObject<HTMLDivElement>;
    onComponentMouseDown: (e: React.MouseEvent, component: TimelineComponent) => void;
    onTimelineDragOver: (e: React.DragEvent) => void;
    onTimelineDragLeave: (e: React.DragEvent) => void;
    onTimelineDrop: (e: React.DragEvent) => void;
    onViewportWidthChange?: (width: number) => void;
    isComponentCompatibleWithTrack: (componentType: string, trackType: string) => boolean;
    readOnly?: boolean;
}

const FilmBuilderTimeline: React.FC<FilmBuilderTimelineProps> = ({
    components,
    tracks,
    playbackState,
    viewState,
    dragState,
    timelineRef,
    onComponentMouseDown,
    onTimelineDragOver,
    onTimelineDragLeave,
    onTimelineDrop,
    onViewportWidthChange,
    isComponentCompatibleWithTrack,
    readOnly = false,
}) => {
    const timelineWidth = playbackState.totalDuration * viewState.zoomLevel;
    const viewportWidth = viewState.viewportWidth; // Use viewport width from state

    // Detect viewport size changes and notify parent
    React.useEffect(() => {
        const timelineContainer = timelineRef.current?.parentElement;
        if (!timelineContainer || !onViewportWidthChange) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width !== viewState.viewportWidth) {
                    onViewportWidthChange(width);
                }
            }
        });

        resizeObserver.observe(timelineContainer);

        return () => {
            resizeObserver.disconnect();
        };
    }, [timelineRef, onViewportWidthChange, viewState.viewportWidth]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const getTrackIcon = (trackType: string) => {
        switch (trackType) {
            case "video":
                return <VideoIcon fontSize="small" />;
            case "audio":
                return <AudioIcon fontSize="small" />;
            case "graphics":
                return <GraphicsIcon fontSize="small" />;
            case "music":
                return <MusicIcon fontSize="small" />;
            default:
                return <VideoIcon fontSize="small" />;
        }
    };

    const getCurrentTimeIndicator = () => {
        // Calculate total height including separator gap
        const audioTracks = tracks.filter(t => t.track_type === "audio" || t.track_type === "music");
        const totalHeight = tracks.length * 40 + (audioTracks.length > 0 ? 24 : 0); // Include separator gap if audio tracks exist

        return (
            <Box
                sx={{
                    position: "absolute",
                    left: playbackState.currentTime * viewState.zoomLevel,
                    top: 0,
                    height: totalHeight, // Use calculated total height
                    width: 2,
                    bgcolor: "error.main",
                    zIndex: 1000,
                    pointerEvents: "none",
                }}
            >
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

    const getSnapGridSeparator = () => {
        if (!viewState.snapToGrid) return null;

        // Find the boundary between video and audio tracks
        const videoTracks = tracks.filter(t => t.track_type === "video" || t.track_type === "graphics");
        const audioTracks = tracks.filter(t => t.track_type === "audio" || t.track_type === "music");

        if (videoTracks.length === 0 || audioTracks.length === 0) return null;

        // Position the separator between video and audio sections
        const separatorY = videoTracks.length * 40 + 12; // Center in the 24px gap

        const gridMarkers = [];
        const markerInterval = viewState.zoomLevel < 15 ? 30 : viewState.zoomLevel < 25 ? 15 : 5;

        // Simple snap markers - just tiny dots, perfectly centered
        for (let time = 0; time <= playbackState.totalDuration; time += viewState.gridSize) {
            gridMarkers.push(
                <Box
                    key={`snap-${time}`}
                    sx={{
                        position: "absolute",
                        left: time * viewState.zoomLevel - 1,
                        top: separatorY - 1, // Center the 2px dot
                        width: 2,
                        height: 2,
                        bgcolor: "#666",
                        borderRadius: "50%",
                        pointerEvents: "none",
                    }}
                />
            );
        }

        // Clean time labels, vertically aligned with the snap dots and more visible
        for (let time = 0; time <= playbackState.totalDuration; time += markerInterval) {
            if (time % (markerInterval * 2) === 0) {
                gridMarkers.push(
                    <Typography
                        key={`time-${time}`}
                        variant="caption"
                        sx={{
                            position: "absolute",
                            left: time * viewState.zoomLevel + 6,
                            top: separatorY - 6, // Vertically align with the snap dots
                            fontSize: "0.65rem",
                            color: "#bbb", // Lighter color for better visibility
                            pointerEvents: "none",
                            fontFamily: "monospace",
                            fontWeight: 500, // Make text bolder for better readability
                            textShadow: "0 1px 2px rgba(0,0,0,0.5)", // Add subtle shadow for contrast
                            lineHeight: 1,
                        }}
                    >
                        {formatTime(time)}
                    </Typography>
                );
            }
        }

        return gridMarkers;
    };

    return (
        <Box sx={{ width: "100%", height: "100%" }}>
            <Box
                sx={{
                    overflow: "hidden",
                    bgcolor: "transparent",
                    height: "100%"
                }}
            >
                {/* Timeline Tracks */}
                <Box
                    sx={{
                        position: "relative",
                        overflow: "hidden", // Remove all scrolling
                        height: tracks.length * 40 + 24, // Clean gap for separator
                        bgcolor: "transparent",
                        transition: "background-color 0.2s ease-in-out",
                        pb: 1,
                    }}
                >
                    <Box
                        ref={timelineRef}
                        sx={{
                            position: "relative",
                            width: Math.max(timelineWidth, viewportWidth),
                            height: "100%",
                            cursor: dragState.draggedLibraryComponent ? "copy" : "default",
                            transform: `translateX(-${viewState.viewportLeft}px)`, // Apply viewport offset
                            transition: "transform 0.1s ease-out", // Smooth viewport scrolling
                        }}
                        onDragOver={!readOnly ? onTimelineDragOver : undefined}
                        onDragLeave={!readOnly ? onTimelineDragLeave : undefined}
                        onDrop={!readOnly ? onTimelineDrop : undefined}
                    >
                        {/* Snap grid separator (between video and audio) */}
                        {getSnapGridSeparator()}

                        {/* Track backgrounds and labels */}
                        {tracks.map((track, index) => {
                            // Calculate position with separator gap
                            const isAudioTrack = track.track_type === "audio" || track.track_type === "music";

                            let trackPosition = index * 40;
                            if (isAudioTrack) {
                                // Add clean separator gap for audio tracks
                                trackPosition += 24;
                            }

                            // Check if this track is valid for the dragged component
                            const isValidDropTarget =
                                // Library component being dragged from component library
                                (dragState.draggedLibraryComponent &&
                                    isComponentCompatibleWithTrack(dragState.draggedLibraryComponent.type, track.track_type)) ||
                                // Timeline component being moved on timeline
                                (dragState.draggedComponent &&
                                    isComponentCompatibleWithTrack(
                                        dragState.draggedComponent.database_type || dragState.draggedComponent.component_type.toUpperCase(),
                                        track.track_type
                                    ));

                            return (
                                <Box key={track.id}>
                                    {/* Track background */}
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: trackPosition,
                                            left: 0,
                                            right: 0,
                                            height: 40,
                                            bgcolor: track.visible
                                                ? (isValidDropTarget
                                                    ? `${track.color}25` // Brighter for valid drop target
                                                    : `${track.color}10`) // Normal transparency
                                                : "transparent",
                                            borderBottom: "1px solid #2a2a2a",
                                            transition: "background-color 0.2s ease-in-out",
                                        }}
                                    />

                                    {/* Drop message overlay - only show on valid tracks during drag */}
                                    {isValidDropTarget && (dragState.draggedLibraryComponent || dragState.draggedComponent) && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: trackPosition,
                                                left: 0,
                                                right: 0,
                                                height: 40,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                bgcolor: "rgba(25, 118, 210, 0.15)",
                                                borderTop: "2px solid rgba(25, 118, 210, 0.6)",
                                                borderBottom: "2px solid rgba(25, 118, 210, 0.6)",
                                                zIndex: 150,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "primary.main",
                                                    fontWeight: 600,
                                                    fontSize: "0.8rem",
                                                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                                                    bgcolor: "rgba(0,0,0,0.6)",
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                }}
                                            >
                                                {dragState.draggedLibraryComponent
                                                    ? `Drop ${dragState.draggedLibraryComponent.name} here`
                                                    : dragState.draggedComponent
                                                        ? `Move ${dragState.draggedComponent.name} here`
                                                        : "Drop component here"
                                                }
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Floating Track Header */}
                                    <Box
                                        sx={{
                                            position: "absolute", // Use absolute positioning within the timeline container
                                            top: trackPosition + 8,
                                            left: viewState.viewportLeft + 8, // Compensate for viewport offset to stay visible
                                            height: 24,
                                            display: "flex",
                                            alignItems: "center",
                                            zIndex: 200, // Higher z-index to float above everything
                                            transition: "left 0.1s ease-out", // Smooth movement with viewport
                                            "&:hover .track-text": {
                                                opacity: 1,
                                                transform: "translateX(0)",
                                            }
                                        }}
                                    >
                                        {/* Track Icon with Dark Background */}
                                        <Box
                                            sx={{
                                                p: 0.5,
                                                borderRadius: 0.75,
                                                bgcolor: "rgba(0, 0, 0, 0.6)", // Lighter transparent background
                                                color: track.color, // Icon takes the track color
                                                display: "flex",
                                                alignItems: "center",
                                                width: 24,
                                                height: 24,
                                                justifyContent: "center",
                                                boxShadow: "0 2px 6px rgba(0,0,0,0.4)", // Enhanced shadow for floating effect
                                                border: `1px solid ${track.color}30`, // Subtle border using track color
                                                backdropFilter: "blur(4px)", // Add backdrop blur for modern glass effect
                                                transition: "all 0.2s ease-in-out",
                                                "&:hover": {
                                                    transform: "scale(1.1)",
                                                    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                                                    bgcolor: "rgba(0, 0, 0, 0.75)", // Slightly more opaque on hover
                                                    border: `1px solid ${track.color}60`, // More prominent border on hover
                                                }
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
                                                bgcolor: "rgba(0,0,0,0.8)",
                                                px: 0.75,
                                                py: 0.25,
                                                borderRadius: 0.5,
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                whiteSpace: "nowrap",
                                                pointerEvents: "none", // Prevent text from interfering with hover
                                            }}
                                        >
                                            {track.name}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}

                        {/* Timeline components */}
                        {components.map((component) => {
                            const trackIndex = tracks.findIndex((t) => t.id === component.track_id);
                            if (trackIndex === -1) return null;

                            const track = tracks[trackIndex];
                            const isAudioTrack = track.track_type === "audio" || track.track_type === "music";

                            // Calculate position with separator gap
                            let componentTop = trackIndex * 40 + 8;
                            if (isAudioTrack) {
                                // Add clean separator gap for audio tracks
                                componentTop += 24;
                            }

                            const isSelected = viewState.selectedComponent?.id === component.id;
                            const isDragging = dragState.draggedComponent?.id === component.id;

                            return (
                                <Box
                                    key={component.id}
                                    sx={{
                                        position: "absolute",
                                        left: component.start_time * viewState.zoomLevel,
                                        top: componentTop,
                                        width: Math.max(component.duration * viewState.zoomLevel, 20),
                                        height: 24,
                                        bgcolor: component.color,
                                        borderRadius: 1,
                                        border: isDragging
                                            ? "2px solid #ff9800" // Orange border when dragging
                                            : isSelected
                                                ? "2px solid #1976d2" // Blue border when selected
                                                : "1px solid #333", // Default border
                                        cursor: readOnly ? "default" : (component.locked ? "not-allowed" : "grab"),
                                        opacity: isDragging ? 0.9 : 1, // Slightly transparent when dragging
                                        boxShadow: isDragging
                                            ? "0 0 12px rgba(255, 152, 0, 0.5)" // Orange glow when dragging
                                            : isSelected
                                                ? "0 0 8px rgba(25, 118, 210, 0.3)" // Blue glow when selected
                                                : "none",
                                        transition: "border-color 0.1s ease-in-out, box-shadow 0.1s ease-in-out, opacity 0.1s ease-in-out",
                                        display: "flex",
                                        alignItems: "center",
                                        px: 0.75,
                                        overflow: "hidden",
                                        zIndex: isDragging ? 200 : (isSelected ? 100 : 10), // Higher z-index when dragging
                                        "&:hover": readOnly ? {} : {
                                            border: "2px solid #64b5f6", // Light blue border on hover
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                                        },
                                        "&:active": readOnly ? {} : {
                                            cursor: component.locked ? "not-allowed" : "grabbing",
                                        },
                                    }}
                                    onMouseDown={!readOnly && !component.locked ? (e) => onComponentMouseDown(e, component) : undefined}
                                >
                                    {/* Component content */}
                                    <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                                        {component.locked && (
                                            <Tooltip title="Locked component">
                                                <LockIcon sx={{ fontSize: 14, mr: 0.5, color: "white" }} />
                                            </Tooltip>
                                        )}

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "white",
                                                fontWeight: 600,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flex: 1,
                                                fontSize: "0.7rem",
                                            }}
                                        >
                                            {component.name}
                                        </Typography>
                                    </Box>

                                    {/* Duration badge */}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "white",
                                            fontSize: "0.6rem",
                                            bgcolor: "rgba(0,0,0,0.2)",
                                            px: 0.5,
                                            borderRadius: 0.5,
                                            ml: 0.5,
                                        }}
                                    >
                                        {formatTime(component.duration)}
                                    </Typography>
                                </Box>
                            );
                        })}

                        {/* Current time indicator */}
                        {getCurrentTimeIndicator()}
                    </Box>
                </Box>
            </Box>

            {/* Timeline Info */}
            <Box sx={{
                px: 2,
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "transparent",
                borderTop: "1px solid #2a2a2a",
                minHeight: 32,
                flexShrink: 0,
            }}>
                <Typography variant="caption" sx={{
                    fontSize: "0.7rem",
                    color: "#888"
                }}>
                    {components.length} components • {formatTime(playbackState.totalDuration)} • {Math.round((viewState.zoomLevel / 10) * 100)}% zoom
                </Typography>

                {viewState.snapToGrid && (
                    <Chip
                        label={`Snap: ${viewState.gridSize}s`}
                        size="small"
                        variant="outlined"
                        sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            borderColor: "#333",
                            color: "#888",
                            "& .MuiChip-label": { px: 0.5 }
                        }}
                    />
                )}
            </Box>
        </Box>
    );
};

export default FilmBuilderTimeline;
