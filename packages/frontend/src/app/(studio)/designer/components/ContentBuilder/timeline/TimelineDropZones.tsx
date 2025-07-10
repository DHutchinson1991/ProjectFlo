"use client";

import React from "react";
import { Box } from "@mui/material";
import { TimelineTrack } from "../types/timelineTypes";
import { TimelineScene } from "../types/sceneTypes";
import { DragState } from "../types/dragDropTypes";
import { ViewState } from "../types/dragDropTypes";
import TimelineTrackComponent from "./TimelineTrack";
import TimelineSceneElement from "./TimelineSceneElement";

interface TimelineDropZonesProps {
    tracks: TimelineTrack[];
    scenes?: TimelineScene[];
    dragState: DragState;
    viewState: ViewState;
    isSceneCompatibleWithTrack: (sceneType: string, trackType: string) => boolean;
    onSceneMouseDown?: (e: React.MouseEvent, scene: TimelineScene) => void;
    onSceneDelete?: (scene: TimelineScene) => void;
    readOnly?: boolean;
    children?: React.ReactNode;
}

const TimelineDropZones: React.FC<TimelineDropZonesProps> = ({
    tracks,
    scenes = [],
    dragState,
    viewState,
    isSceneCompatibleWithTrack,
    onSceneMouseDown,
    onSceneDelete,
    readOnly = false,
    children,
}) => {
    return (
        <>
            {tracks.map((track, index) => {
                // Calculate position with gap between Video and Audio
                // New order: Graphics (0), Video (1), Audio (2), Music (3)
                // Add 8px gap after Video (index 1)
                let trackPosition = index * 40;
                if (index >= 2) { // Audio and Music tracks (indices 2, 3)
                    trackPosition += 8; // Add 8px gap
                }

                // Check if this track is valid for the dragged scene
                const isValidDropTarget = Boolean(
                    // Library scene being dragged from scenes library
                    (dragState.draggedLibraryScene &&
                        isSceneCompatibleWithTrack(
                            dragState.draggedLibraryScene.type,
                            track.track_type,
                        )) ||
                    // Timeline scene being moved on timeline
                    (dragState.draggedScene &&
                        isSceneCompatibleWithTrack(
                            dragState.draggedScene.database_type ||
                            dragState.draggedScene.scene_type.toUpperCase(),
                            track.track_type,
                        ))
                );

                // Get scenes for this track
                const trackScenes = scenes.filter(scene => scene.track_id === track.id);

                return (
                    <React.Fragment key={track.id}>
                        <TimelineTrackComponent
                            track={track}
                            trackPosition={trackPosition}
                            isValidDropTarget={isValidDropTarget}
                            viewState={viewState}
                            dragState={dragState}
                        >
                            <div /> {/* Empty child element */}
                        </TimelineTrackComponent>

                        {/* Render scenes for this track */}
                        {trackScenes.map((scene) => (
                            <TimelineSceneElement
                                key={scene.id}
                                scene={scene}
                                trackPosition={trackPosition}
                                viewState={viewState}
                                onMouseDown={onSceneMouseDown}
                                onDelete={onSceneDelete}
                                readOnly={readOnly}
                            />
                        ))}
                    </React.Fragment>
                );
            })}

            {/* Collision Preview - show where the dragged scene would be if not for collision */}
            {dragState.draggedScene && dragState.hasCollision && dragState.previewPosition && (
                <Box
                    sx={{
                        position: "absolute",
                        left: dragState.previewPosition.startTime * viewState.zoomLevel,
                        top: (() => {
                            // Find the track position for the preview
                            const trackIndex = tracks.findIndex(t => t.id === dragState.previewPosition!.trackId);
                            let trackPosition = trackIndex * 40;
                            if (trackIndex >= 2) { // Audio and Music tracks
                                trackPosition += 8; // Add gap
                            }
                            return trackPosition + 4;
                        })(),
                        width: dragState.draggedScene.duration * viewState.zoomLevel,
                        height: 32,
                        bgcolor: "rgba(255, 0, 0, 0.3)", // Red tint for collision
                        border: "2px dashed rgba(255, 0, 0, 0.8)",
                        borderRadius: 1,
                        pointerEvents: "none",
                        zIndex: 999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Box
                        sx={{
                            color: "rgba(255, 255, 255, 0.9)",
                            fontSize: "0.6rem",
                            fontWeight: "bold",
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                        }}
                    >
                        ⚠ COLLISION
                    </Box>
                </Box>
            )}

            {children}
        </>
    );
};

export default TimelineDropZones;
