"use client";

import React from "react";
import { Box, Typography, Select, MenuItem, FormControl } from "@mui/material";
import { TimelineScene } from "../types/sceneTypes";
import { TimelineTrack, PlaybackState } from "../types/timelineTypes";
import { ViewState } from "../types/dragDropTypes";
import { DragState } from "../types/dragDropTypes";
import { SceneGroup } from "../types/sceneTypes";
import { formatTime } from "../utils";
import TimelinePlayhead from "./TimelinePlayhead";
import TimelineSnapGrid from "./TimelineSnapGrid";
import TimelineDropZones from "./TimelineDropZones";

interface ContentBuilderTimelineProps {
    scenes: TimelineScene[];
    tracks: TimelineTrack[];
    playbackState: PlaybackState;
    viewState: ViewState;
    dragState: DragState;
    timelineRef: React.RefObject<HTMLDivElement>;
    onSceneMouseDown: (e: React.MouseEvent, scene: TimelineScene) => void;
    onSceneDelete?: (scene: TimelineScene) => void;
    onTimelineDragOver: (e: React.DragEvent) => void;
    onTimelineDragLeave: (e: React.DragEvent) => void;
    onTimelineDrop: (e: React.DragEvent) => void;
    onViewportWidthChange?: (width: number) => void;
    isSceneCompatibleWithTrack: (sceneType: string, trackType: string) => boolean;
    readOnly?: boolean;
    // New grouping props
    sceneGroups?: Map<string, SceneGroup>;
    getGroupForScene?: (scene: TimelineScene) => SceneGroup | null;
    isSceneInCollapsedGroup?: (scene: TimelineScene) => boolean;
}

const ContentBuilderTimeline: React.FC<ContentBuilderTimelineProps> = ({
    scenes,
    tracks,
    playbackState,
    viewState,
    dragState,
    timelineRef,
    onSceneMouseDown,
    onSceneDelete,
    onTimelineDragOver,
    onTimelineDragLeave,
    onTimelineDrop,
    onViewportWidthChange,
    isSceneCompatibleWithTrack,
    readOnly = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sceneGroups,
    getGroupForScene,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSceneInCollapsedGroup,
}) => {
    // State for snap interval
    const [snapInterval, setSnapInterval] = React.useState<number>(5);

    // Calculate the actual timeline duration based on scenes
    const maxSceneEndTime = scenes.length > 0
        ? Math.max(...scenes.map(scene => scene.start_time + scene.duration))
        : 0;

    // Timeline duration is minimum 60 seconds (1 minute) or the longest scene end time
    const effectiveTimelineDuration = Math.max(60, maxSceneEndTime, playbackState.totalDuration);

    const timelineWidth = effectiveTimelineDuration * viewState.zoomLevel;
    const viewportWidth = viewState.viewportWidth; // Use viewport width from state

    // Calculate timeline height based on tracks with gap
    const totalTracksHeight = tracks.length * 40 + 8; // Add 8px for the gap
    const timelineHeight = tracks.length > 0
        ? 16 + // Top padding above tracks
        tracks.length * 40 + // All track heights (40px each)
        8 + // Gap between Video and Audio
        16 + // Bottom padding below tracks
        32 + // Timeline info footer (minimum 32px)
        32   // Container padding (16px top + 16px bottom)
        : 120; // Minimum height when no tracks

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

    return (
        <Box
            sx={{
                position: "relative",
                padding: "1px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, rgba(123, 97, 255, 0.2) 0%, rgba(255, 107, 157, 0.15) 50%, rgba(0, 229, 255, 0.2) 100%)",
                overflow: "hidden",
                transition: "box-shadow 0.2s ease-in-out",
                "&:hover": {
                    boxShadow: "0 2px 8px rgba(123, 97, 255, 0.1), 0 0 12px rgba(255, 107, 157, 0.05)",
                },
            }}
        >
            <Box
                sx={{
                    height: `${timelineHeight}px`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: "rgba(8, 8, 12, 0.85)",
                    borderRadius: "11px",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        py: 3,
                        px: 2,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    {/* Timeline Tracks */}
                    <Box
                        sx={{
                            position: "relative",
                            overflow: "hidden",
                            flex: 1,
                            minHeight: totalTracksHeight,
                            maxHeight: totalTracksHeight,
                            bgcolor: "rgba(5, 5, 8, 0.8)",
                            transition: "background-color 0.2s ease-in-out",
                            borderRadius: 1,
                            border: "1px solid rgba(255, 255, 255, 0.03)",
                            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
                        }}
                    >
                        <Box
                            ref={timelineRef}
                            sx={{
                                position: "relative",
                                width: Math.max(timelineWidth, viewportWidth),
                                height: "100%",
                                cursor: dragState.draggedLibraryScene ? "copy" : "default",
                                transform: `translateX(-${viewState.viewportLeft}px)`,
                                transition: "transform 0.1s ease-out",
                            }}
                            onDragOver={!readOnly ? onTimelineDragOver : undefined}
                            onDragLeave={!readOnly ? onTimelineDragLeave : undefined}
                            onDrop={!readOnly ? onTimelineDrop : undefined}
                        >
                            {/* Track Drop Zones */}
                            <TimelineDropZones
                                tracks={tracks}
                                scenes={scenes}
                                dragState={dragState}
                                viewState={viewState}
                                isSceneCompatibleWithTrack={isSceneCompatibleWithTrack}
                                onSceneMouseDown={onSceneMouseDown}
                                onSceneDelete={onSceneDelete}
                                readOnly={readOnly}
                            >
                                {/* Additional content can go here */}
                            </TimelineDropZones>

                            {/* Time reference lines (snap grid) */}
                            <TimelineSnapGrid
                                viewState={viewState}
                                snapInterval={snapInterval}
                                effectiveTimelineDuration={effectiveTimelineDuration}
                                totalTracksHeight={totalTracksHeight}
                            />

                            {/* Current time indicator */}
                            <TimelinePlayhead
                                playbackState={playbackState}
                                viewState={viewState}
                                totalTracksHeight={totalTracksHeight}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Timeline Info */}
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
                            onChange={(e) => setSnapInterval(Number(e.target.value))}
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
            </Box>
        </Box>
    );
};

export default ContentBuilderTimeline;
