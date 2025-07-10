"use client";

import React from "react";
import { Box } from "@mui/material";
import { PlaybackState } from "../types/timelineTypes";
import { ViewState } from "../types/dragDropTypes";
import { SaveState } from "../types/controlTypes";
import PlaybackControls from "./PlaybackControls";
import TimelineControls from "./TimelineControls";
import SaveControls from "./SaveControls";
import ViewControls from "./ViewControls";

interface ContentBuilderControlsProps {
    // Playback control props
    playbackState: PlaybackState;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    onSpeedChange?: (speed: number) => void;

    // Timeline control props
    viewState: ViewState;
    onZoomChange: (zoom: number) => void;
    onSnapToggle: () => void;
    onFitToView?: () => void;

    // Save control props
    saveState: SaveState;
    onSave: () => void;
    onAutoSaveToggle?: () => void;
    autoSaveEnabled?: boolean;

    // View control props
    viewMode: "list" | "grid";
    onViewModeChange: (mode: "list" | "grid") => void;
    isFullscreen?: boolean;
    onFullscreenToggle?: () => void;

    // General props
    readOnly?: boolean;
    layout?: "horizontal" | "vertical";
}

const ContentBuilderControls: React.FC<ContentBuilderControlsProps> = ({
    // Playback props
    playbackState,
    onPlay,
    onPause,
    onStop,
    onSeek,
    onSpeedChange,

    // Timeline props
    viewState,
    onZoomChange,
    onSnapToggle,
    onFitToView,

    // Save props
    saveState,
    onSave,
    onAutoSaveToggle,
    autoSaveEnabled,

    // View props
    viewMode,
    onViewModeChange,
    isFullscreen,
    onFullscreenToggle,

    // General props
    readOnly = false,
    layout = "horizontal",
}) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: layout === "horizontal" ? "row" : "column",
                gap: 2,
                p: 2,
                bgcolor: "rgba(8, 8, 12, 0.85)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.1)",
                flexWrap: layout === "horizontal" ? "wrap" : "nowrap",
            }}
        >
            {/* Playback Controls */}
            <PlaybackControls
                playbackState={playbackState}
                onPlay={onPlay}
                onPause={onPause}
                onStop={onStop}
                onSeek={onSeek}
                onSpeedChange={onSpeedChange}
                readOnly={readOnly}
            />

            {/* Timeline Controls */}
            <TimelineControls
                viewState={viewState}
                onZoomChange={onZoomChange}
                onSnapToggle={onSnapToggle}
                onFitToView={onFitToView}
                readOnly={readOnly}
            />

            {/* Save Controls */}
            <SaveControls
                saveState={saveState}
                onSave={onSave}
                onAutoSaveToggle={onAutoSaveToggle}
                autoSaveEnabled={autoSaveEnabled}
                readOnly={readOnly}
            />

            {/* View Controls */}
            <ViewControls
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                isFullscreen={isFullscreen}
                onFullscreenToggle={onFullscreenToggle}
                readOnly={readOnly}
            />
        </Box>
    );
};

export default ContentBuilderControls;
