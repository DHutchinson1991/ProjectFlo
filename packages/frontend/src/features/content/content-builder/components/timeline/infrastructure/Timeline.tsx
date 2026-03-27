"use client";

import React from "react";
import { Box } from "@mui/material";
import { TimelineScene } from "@/features/content/content-builder/types/timeline";
import { TimelineTrack, PlaybackState } from "@/features/content/content-builder/types/timeline";
import { ViewState, DragState } from "@/features/content/content-builder/types/timeline";
import { SceneGroup } from "@/features/content/scenes/types";
import Playhead from "./Playhead";
import SnapGrid from "./SnapGrid";
import DropZones from "./DropZones";
import Toolbar from "./Toolbar";
import ScenesHeader from "../scenes/ScenesHeader";

interface TimelineProps {
    scenes: TimelineScene[];
    tracks: TimelineTrack[];
    playbackState: PlaybackState;
    viewState: ViewState;
    dragState: DragState;
    timelineRef: React.RefObject<HTMLDivElement>;
    onSceneMouseDown: (e: React.MouseEvent, scene: TimelineScene) => void;
    onSceneDelete?: (scene: TimelineScene) => void;
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
    // New Header Controls
    onAddScene?: () => void;
    onReorderScene?: (direction: 'left' | 'right', sceneName: string) => void;
    onDeleteScene?: (sceneIds: number[]) => void | Promise<void>;
    onUpdateScene?: (scene: TimelineScene) => void;
    hoveredMomentId?: number | null;
    onMomentHover?: (momentId: number | null) => void;
}

const Timeline: React.FC<TimelineProps> = ({
    scenes,
    tracks,
    playbackState,
    viewState,
    dragState,
    timelineRef,
    onSceneMouseDown,
    onSceneDelete,
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
    onAddScene,
    onReorderScene,
    onDeleteScene,
    onUpdateScene,
    hoveredMomentId,
    onMomentHover,
}) => {
    // State for snap interval
    const [snapInterval, setSnapInterval] = React.useState<number>(5);

    // Calculate the actual timeline duration based on scenes
    const maxSceneEndTime = scenes.length > 0
        ? Math.max(...scenes.map(scene => scene.start_time + scene.duration))
        : 0;

    // Timeline duration is minimum 60 seconds (1 minute) or the longest scene end time
    const effectiveTimelineDuration = Math.max(60, maxSceneEndTime, playbackState.totalDuration);

    // Ensure zoom level is valid before calculating width
    const safeZoomLevel = Number.isFinite(viewState.zoomLevel) && viewState.zoomLevel > 0 
        ? viewState.zoomLevel 
        : 5; // Fallback to default zoom if invalid

    const timelineWidth = effectiveTimelineDuration * safeZoomLevel;
    const viewportWidth = viewState.viewportWidth; // Use viewport width from state

    // Count gaps only where we transition from video -> audio
    const gapCount = tracks.reduce((count, track, idx) => {
        if (idx === 0) return count;
        const prev = tracks[idx - 1];
        return prev.track_type === "video" && track.track_type === "audio" ? count + 1 : count;
    }, 0);

    // Calculate timeline height based on tracks with the computed gaps
    const totalTracksHeight = tracks.length * 40 + gapCount * 8;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const timelineHeight = tracks.length > 0
        ? 16 + // Top padding above tracks
        tracks.length * 40 + // All track heights (40px each)
        gapCount * 8 + // Gaps between Video and Audio
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
                    {/* Scene Headers - shows scene titles above timeline */}
                    <ScenesHeader 
                        scenes={scenes}
                        viewState={viewState}
                        zoomLevel={safeZoomLevel}
                        tracks={tracks}
                        onAddScene={onAddScene}
                        onReorderScene={onReorderScene}
                        onDeleteScene={onDeleteScene}
                        onUpdateScene={onUpdateScene}
                        onMomentHover={onMomentHover}
                    />

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
                                maxWidth: viewportWidth, // Cap at viewport width to prevent infinite resize loop
                                height: "100%",
                                cursor: dragState.draggedLibraryScene ? "copy" : "default",
                                transform: `translateX(-${viewState.viewportLeft}px)`,
                                transition: "transform 0.1s ease-out",
                                overflow: "hidden", // Ensure content doesn't overflow
                            }}
                        >
                            {/* Track Drop Zones */}
                            <DropZones
                                tracks={tracks}
                                scenes={scenes}
                                dragState={dragState}
                                viewState={viewState}
                                isSceneCompatibleWithTrack={isSceneCompatibleWithTrack}
                                onSceneMouseDown={onSceneMouseDown}
                                onSceneDelete={onSceneDelete}
                                readOnly={readOnly}
                                hoveredMomentId={hoveredMomentId}
                            >
                                {/* Additional content can go here */}
                            </DropZones>

                            {/* Time reference lines (snap grid) */}
                            <SnapGrid
                                viewState={viewState}
                                snapInterval={snapInterval}
                                effectiveTimelineDuration={effectiveTimelineDuration}
                                totalTracksHeight={totalTracksHeight}
                            />

                            {/* Current time indicator */}
                            <Playhead
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
                <Toolbar
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

export default React.memo(Timeline);
