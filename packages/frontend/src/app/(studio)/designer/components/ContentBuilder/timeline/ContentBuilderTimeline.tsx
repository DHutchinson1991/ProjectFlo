"use client";

import React from "react";
import { Box } from "@mui/material";
import { TimelineScene } from "../types/sceneTypes";
import { TimelineTrack, PlaybackState } from "../types/timelineTypes";
import { ViewState } from "../types/dragDropTypes";
import { DragState } from "../types/dragDropTypes";
import { SceneGroup } from "../types/sceneTypes";
import TimelinePlayhead from "./TimelinePlayhead";
import TimelineSnapGrid from "./TimelineSnapGrid";
import TimelineDropZones from "./TimelineDropZones";
import TimelineBottomControls from "./TimelineBottomControls";

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
    // New zoom and snap control props
    onZoomChange: (zoom: number) => void;
    onSnapToggle: () => void;
    onFitToView?: () => void;
    onTimelineClick?: (time: number) => void;
    scrollToTime?: (time: number) => void;
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getGroupForScene,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSceneInCollapsedGroup,
    // New zoom and snap handlers
    onZoomChange,
    onSnapToggle,
    onFitToView,
    onTimelineClick,
    scrollToTime,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                    height: "100%", // Use full available height instead of calculated
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: "rgba(8, 8, 12, 0.85)",
                    borderRadius: "11px",

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
                            data-timeline-container
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
                                onTimelineClick={onTimelineClick}
                                readOnly={readOnly}
                                scrollToTime={scrollToTime}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Timeline Bottom Controls */}
                <TimelineBottomControls
                    viewState={viewState}
                    onZoomChange={onZoomChange}
                    onSnapToggle={onSnapToggle}
                    onFitToView={onFitToView}
                    snapInterval={snapInterval}
                    onSnapIntervalChange={setSnapInterval}
                    effectiveTimelineDuration={effectiveTimelineDuration}
                    sceneCount={scenes.length}
                    readOnly={readOnly}
                />
            </Box>
        </Box>
    );
};

export default ContentBuilderTimeline;
