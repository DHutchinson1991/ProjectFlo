"use client";

import React from "react";
import { Box } from "@mui/material";
import { TimelineTrack } from "@/lib/types/timeline";
import { TimelineScene } from "@/lib/types/timeline";
import { DragState, ViewState } from "@/lib/types/timeline";
import TimelineTrackComponent from "./Track";
import SceneBlockComponent from "../scenes/SceneBlock";

interface DropZonesProps {
    tracks: TimelineTrack[];
    scenes?: TimelineScene[];
    dragState: DragState;
    viewState: ViewState;
    isSceneCompatibleWithTrack: (sceneType: string, trackType: string) => boolean;
    onSceneMouseDown?: (e: React.MouseEvent, scene: TimelineScene) => void;
    onSceneDelete?: (scene: TimelineScene) => void;
    readOnly?: boolean;
    hoveredMomentId?: number | null;
    children?: React.ReactNode;
}

const DropZones: React.FC<DropZonesProps> = ({
    tracks,
    scenes = [],
    dragState,
    viewState,
    isSceneCompatibleWithTrack,
    onSceneMouseDown,
    onSceneDelete,
    readOnly = false,
    hoveredMomentId,
    children,
}) => {
    const hoveredMomentInfo = React.useMemo(() => {
        if (!hoveredMomentId) return null;

        for (const scene of scenes) {
            const moments = (scene as any).moments || [];
            const momentIndex = moments.findIndex((m: any) => m.id === hoveredMomentId);
            if (momentIndex === -1) continue;

            const moment = moments[momentIndex];
            const totalMomentsDuration = moments.reduce((sum: number, m: any) => {
                return sum + (m.duration || m.duration_seconds || 0);
            }, 0);

            if (!totalMomentsDuration || !scene.duration) return null;

            const momentDuration = moment.duration || moment.duration_seconds || 0;
            const offsetDuration = moments.slice(0, momentIndex).reduce((sum: number, m: any) => {
                return sum + (m.duration || m.duration_seconds || 0);
            }, 0);

            const startRatio = offsetDuration / totalMomentsDuration;
            const widthRatio = momentDuration / totalMomentsDuration;

            const startTime = (scene.start_time || 0) + scene.duration * startRatio;
            const widthTime = scene.duration * widthRatio;

            return {
                startTime,
                widthTime,
            };
        }

        return null;
    }, [hoveredMomentId, scenes]);

    const totalTracksHeight = React.useMemo(() => {
        const gapCount = tracks.reduce((count, track, idx) => {
            if (idx === 0) return count;
            const prev = tracks[idx - 1];
            return prev.track_type === "video" && track.track_type === "audio" ? count + 1 : count;
        }, 0);
        return tracks.length * 40 + gapCount * 8;
    }, [tracks]);

    return (
        <>
            {hoveredMomentInfo && (
                <Box
                    sx={{
                        position: "absolute",
                        left: hoveredMomentInfo.startTime * viewState.zoomLevel,
                        top: 0,
                        width: hoveredMomentInfo.widthTime * viewState.zoomLevel,
                        height: totalTracksHeight,
                        pointerEvents: "none",
                        border: "2px solid #7b61ff",
                        zIndex: 10,
                    }}
                />
            )}
            {tracks.map((track, index) => {
                // Calculate gaps only at transitions from video -> audio
                const gapsBefore = tracks.slice(0, index).reduce((count, t, idx2) => {
                    const next = tracks[idx2 + 1];
                    if (!next) return count;
                    return t.track_type === "video" && next.track_type === "audio" ? count + 1 : count;
                }, 0);

                const trackPosition = index * 40 + gapsBefore * 8;

                // Check if this track is valid for the dragged timeline scene
                const isValidDropTarget = Boolean(
                    dragState.draggedScene &&
                    isSceneCompatibleWithTrack(
                        dragState.draggedScene.database_type ||
                        dragState.draggedScene.scene_type.toUpperCase(),
                        track.track_type,
                    )
                );

                // Get scenes for this track
                const trackScenes = scenes.filter(scene => {
                    const isMomentsContainer = (scene as any).database_type === 'MOMENTS_CONTAINER';
                    const moments = (scene as any).moments || [];
                    const hasRecordingSetup =
                        moments.some((m: any) => !!m.recording_setup) ||
                        !!(scene as any).recording_setup;
                    const normalizedTrackType = String(track.track_type).toLowerCase();
                    const defaultTrackType = ['video', 'audio', 'graphics'].includes(normalizedTrackType);
                    const isMusicTrack = normalizedTrackType === 'music';
                    const hasSceneMusic = !!(scene as any).scene_music || !!(scene as any).music;
                    const hasMomentMusic = moments.some((m: any) => !!(m.moment_music || m.music));

                    if (scene.track_id === track.id) return true;
                    if (isMomentsContainer && (hasRecordingSetup || defaultTrackType || (isMusicTrack && (hasSceneMusic || hasMomentMusic)))) return true;
                    return false;
                });

                return (
                    <React.Fragment key={track.id}>
                        {/* Per-track highlight using track color */}
                        {hoveredMomentInfo && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: hoveredMomentInfo.startTime * viewState.zoomLevel,
                                    top: trackPosition,
                                    width: hoveredMomentInfo.widthTime * viewState.zoomLevel,
                                    height: 40,
                                    bgcolor: track.color || "#7b61ff",
                                    opacity: 0.3,
                                    pointerEvents: "none",
                                    zIndex: 1,
                                }}
                            />
                        )}

                        <TimelineTrackComponent
                            track={track}
                            trackPosition={trackPosition}
                            isValidDropTarget={isValidDropTarget}
                            viewState={viewState}
                        >
                            <div /> {/* Empty child element */}
                        </TimelineTrackComponent>

                        {/* Render scenes for this track */}
                        {trackScenes.map((scene) => (
                            <SceneBlockComponent
                                key={scene.id}
                                scene={scene}
                                trackPosition={trackPosition}
                                trackId={track.id}
                                trackType={track.track_type}
                                trackName={track.name}
                                allTracks={tracks}
                                viewState={viewState}
                                onMouseDown={onSceneMouseDown}
                                onDelete={onSceneDelete}
                                readOnly={readOnly}
                                hoveredMomentId={hoveredMomentId}
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
                            const gapsBefore = tracks.slice(0, trackIndex).reduce((count, t, idx2) => {
                                const next = tracks[idx2 + 1];
                                if (!next) return count;
                                return t.track_type === "video" && next.track_type === "audio" ? count + 1 : count;
                            }, 0);
                            const trackPosition = trackIndex * 40 + gapsBefore * 8;
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

// Memoize to prevent re-renders when parent Timeline updates with new scenes
export default React.memo(DropZones);
