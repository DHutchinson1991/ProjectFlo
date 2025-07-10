import { useState, useEffect, useCallback, useMemo } from "react";
import { TimelineScene, ScenesLibrary } from "../types/sceneTypes";
import { TimelineTrack } from "../types/timelineTypes";
import { DragState, ViewState } from "../types/dragDropTypes";
import { isSceneCompatibleWithTrack } from "../utils";

/**
 * Hook for managing drag and drop functionality with viewport management
 */
export const useDragAndDrop = (
    scenes: TimelineScene[],
    setScenes: React.Dispatch<React.SetStateAction<TimelineScene[]>>,
    tracks: TimelineTrack[],
    timelineRef?: React.RefObject<HTMLDivElement>,
) => {
    const [dragState, setDragState] = useState<DragState>({
        draggedScene: null,
        draggedLibraryScene: null,
        dragOffset: { x: 0, y: 0 },
        isDragActive: false,
        hasCollision: false,
        previewPosition: undefined,
    });

    const [viewState, setViewState] = useState<ViewState>({
        zoomLevel: 5, // pixels per second - will be adjusted to fit 1 minute on load
        snapToGrid: true,
        gridSize: 5, // 5-second snap grid
        selectedScene: null,
        viewportLeft: 0, // timeline scroll position
        viewportWidth: 800, // default viewport width
    });

    // Effect to adjust initial zoom level to fit 1 minute in viewport
    useEffect(() => {
        if (viewState.viewportWidth > 0) {
            // Calculate zoom level to make 60 seconds (1 minute) fit the viewport width
            // Leave some padding (80px) for better UX
            const targetZoomLevel = Math.max(1, (viewState.viewportWidth - 80) / 60);

            // Only update if it's significantly different from current zoom
            if (Math.abs(viewState.zoomLevel - targetZoomLevel) > 1) {
                setViewState(prev => ({
                    ...prev,
                    zoomLevel: Math.round(targetZoomLevel * 2) / 2 // Round to nearest 0.5
                }));
            }
        }
    }, [viewState.viewportWidth]); // Only run when viewport width changes

    const handleSceneMouseDown = (e: React.MouseEvent, scene: TimelineScene) => {
        if (e.button !== 0) return; // Only handle left mouse button

        e.preventDefault();
        e.stopPropagation();

        const timelineRect = timelineRef?.current?.getBoundingClientRect();
        if (!timelineRect) return;

        const offsetX =
            e.clientX - (timelineRect.left + scene.start_time * viewState.zoomLevel);
        const offsetY = e.clientY - timelineRect.top;

        setDragState({
            draggedScene: scene,
            draggedLibraryScene: null,
            dragOffset: { x: offsetX, y: offsetY },
            isDragActive: true,
            hasCollision: false,
            previewPosition: undefined,
        });
        setViewState((prev: ViewState) => ({ ...prev, selectedScene: scene }));
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragState.draggedScene) return;

            const timelineRect = timelineRef?.current?.getBoundingClientRect();
            if (!timelineRect) return;

            const mouseX = e.clientX - timelineRect.left - dragState.dragOffset.x;
            const mouseY = e.clientY - timelineRect.top - dragState.dragOffset.y;

            let newStartTime = mouseX / viewState.zoomLevel;
            if (viewState.snapToGrid) {
                newStartTime =
                    Math.round(newStartTime / viewState.gridSize) * viewState.gridSize;
            }
            newStartTime = Math.max(0, newStartTime);

            // Find target track based on mouse Y position
            let targetTrackId = dragState.draggedScene.track_id;

            // Calculate track index based on mouse Y position
            // Account for track layout: video/graphics tracks first, then audio tracks with separator
            const videoTracks = tracks.filter(
                (t) => t.track_type === "video" || t.track_type === "graphics",
            );
            const audioTracks = tracks.filter(
                (t) => t.track_type === "audio" || t.track_type === "music",
            );

            let trackIndex = -1;
            if (mouseY < videoTracks.length * 40) {
                // In video/graphics section
                trackIndex = Math.floor(mouseY / 40);
            } else if (mouseY >= videoTracks.length * 40 + 24) {
                // In audio section (after separator gap)
                const audioY = mouseY - (videoTracks.length * 40 + 24);
                const audioIndex = Math.floor(audioY / 40);
                if (audioIndex >= 0 && audioIndex < audioTracks.length) {
                    trackIndex = videoTracks.length + audioIndex;
                }
            }

            if (trackIndex >= 0 && trackIndex < tracks.length) {
                const targetTrack = tracks[trackIndex];
                const sceneType =
                    dragState.draggedScene.database_type ||
                    dragState.draggedScene.scene_type.toUpperCase();
                // Only allow track change if scene type is compatible with target track
                if (isSceneCompatibleWithTrack(sceneType, targetTrack.track_type)) {
                    targetTrackId = targetTrack.id;
                }
                // If not compatible, keep the current track
            }

            // Check for collisions and update drag state
            const hasCollision = scenes.some((scene) => {
                if (scene.id === dragState.draggedScene!.id) return false;
                if (scene.track_id !== targetTrackId) return false;

                const sceneEnd = scene.start_time + scene.duration;
                const draggedEnd = newStartTime + dragState.draggedScene!.duration;

                return !(newStartTime >= sceneEnd || draggedEnd <= scene.start_time);
            });

            // Update drag state with collision info and preview position
            setDragState(prev => ({
                ...prev,
                hasCollision,
                previewPosition: { startTime: newStartTime, trackId: targetTrackId }
            }));

            // Only update scene positions if there's no collision
            if (!hasCollision) {
                setScenes((prevScenes: TimelineScene[]) => {
                    return prevScenes.map((scene) =>
                        scene.id === dragState.draggedScene!.id
                            ? { ...scene, start_time: newStartTime, track_id: targetTrackId }
                            : scene,
                    );
                });
            }
        },
        [
            dragState.draggedScene,
            dragState.dragOffset,
            viewState.zoomLevel,
            viewState.snapToGrid,
            viewState.gridSize,
            tracks,
            setScenes,
        ],
    );

    const handleMouseUp = useCallback(() => {
        setDragState((prev: DragState) => ({
            ...prev,
            draggedScene: null,
            isDragActive: false,
            hasCollision: false,
            previewPosition: undefined,
        }));
    }, []);

    // Helper function to get valid track for a scene type
    const getValidTracksForScene = useCallback((sceneType: string): TimelineTrack[] => {
        return tracks.filter((track) =>
            isSceneCompatibleWithTrack(sceneType, track.track_type),
        );
    }, [tracks]);

    const handleLibrarySceneDragStart = (
        e: React.DragEvent,
        scene: ScenesLibrary,
    ) => {
        e.dataTransfer.setData("application/json", JSON.stringify(scene));
        setDragState((prev: DragState) => ({ ...prev, draggedLibraryScene: scene }));
    };

    const handleTimelineDragOver = (e: React.DragEvent) => {
        e.preventDefault();

        if (!dragState.draggedLibraryScene) return;

        // Calculate which track the mouse is over
        const timelineRect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - timelineRect.top;
        const trackHeight = 60; // 40px track + 20px gap for audio tracks
        let trackIndex = Math.floor(mouseY / trackHeight);

        // Adjust for audio track spacing
        const videoTracks = tracks.filter(
            (t) => t.track_type === "video" || t.track_type === "graphics",
        );
        if (trackIndex >= videoTracks.length) {
            // Mouse is in the audio section - adjust for the separator gap
            const adjustedY = mouseY - (videoTracks.length * 40 + 24);
            const audioTrackIndex = Math.floor(adjustedY / 40);
            trackIndex = videoTracks.length + audioTrackIndex;
        }

        const targetTrack = tracks[trackIndex];
        const isValidDrop =
            targetTrack &&
            isSceneCompatibleWithTrack(
                dragState.draggedLibraryScene.type,
                targetTrack.track_type,
            );

        e.dataTransfer.dropEffect = isValidDrop ? "copy" : "none";
    };

    const handleTimelineDragLeave = () => {
        // Remove any visual feedback when leaving the timeline
    };

    const handleTimelineDrop = async (e: React.DragEvent) => {
        e.preventDefault();

        try {
            const sceneData = JSON.parse(
                e.dataTransfer.getData("application/json"),
            ) as ScenesLibrary;

            const timelineRect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - timelineRect.left;
            const mouseY = e.clientY - timelineRect.top;

            let dropTime = mouseX / viewState.zoomLevel;
            if (viewState.snapToGrid) {
                dropTime =
                    Math.round(dropTime / viewState.gridSize) * viewState.gridSize;
            }
            dropTime = Math.max(0, dropTime);

            // Determine target track based on drop position with proper spacing calculation
            const trackHeight = 60; // 40px track + 20px gap for audio tracks
            let trackIndex = Math.floor(mouseY / trackHeight);

            // Adjust for audio track spacing
            const videoTracks = tracks.filter(
                (t) => t.track_type === "video" || t.track_type === "graphics",
            );
            if (trackIndex >= videoTracks.length) {
                // Mouse is in the audio section - adjust for the separator gap
                const adjustedY = mouseY - (videoTracks.length * 40 + 24);
                const audioTrackIndex = Math.floor(adjustedY / 40);
                trackIndex = videoTracks.length + audioTrackIndex;
            }

            const targetTrack = tracks[trackIndex];

            // Validate track exists and scene type is compatible
            if (!targetTrack) {
                console.warn("No valid track found at drop position");
                return;
            }

            if (!isSceneCompatibleWithTrack(sceneData.type, targetTrack.track_type)) {
                console.warn(
                    `Scene type ${sceneData.type} is not compatible with track type ${targetTrack.track_type}`,
                );
                return;
            }

            // Get default duration from scene or use 30 seconds
            const defaultDuration = sceneData.estimated_duration || 30;

            // Map scene type to track type for timeline scene
            const sceneTypeMapping: Record<
                string,
                "video" | "audio" | "graphics" | "music"
            > = {
                VIDEO: "video",
                AUDIO: "audio",
                GRAPHICS: "graphics",
                MUSIC: "music",
            };

            const sceneType = sceneTypeMapping[sceneData.type];

            // Create new timeline scene
            const newScene: TimelineScene = {
                id: Date.now() + Math.random(), // Temporary ID
                name: sceneData.name,
                start_time: dropTime,
                duration: defaultDuration,
                track_id: targetTrack.id,
                scene_type: sceneType,
                color: targetTrack.color,
                description: sceneData.description,
                database_type: sceneData.type,
            };

            // Check for collisions before adding
            const hasCollision = scenes.some((scene) => {
                if (scene.track_id !== newScene.track_id) return false;
                const sceneEnd = scene.start_time + scene.duration;
                const newEnd = newScene.start_time + newScene.duration;
                return !(newScene.start_time >= sceneEnd || newEnd <= scene.start_time);
            });

            if (!hasCollision) {
                setScenes((prev: TimelineScene[]) => [...prev, newScene]);

                // Scene added successfully - no additional task handling needed for now
                console.log("Scene added to timeline:", sceneData.id);
            } else {
                console.warn("Cannot drop scene: collision detected");
            }
        } catch (error) {
            console.error("Error handling drop:", error);
        }

        setDragState((prev: DragState) => ({ ...prev, draggedLibraryScene: null }));
    };

    const handleLibrarySceneDragEnd = () => {
        setDragState((prev: DragState) => ({ ...prev, draggedLibraryScene: null }));
    };

    // Viewport management functions for timeline navigation
    const updateViewportWidth = useCallback((width: number) => {
        setViewState((prev: ViewState) => ({ ...prev, viewportWidth: width }));
    }, []);

    const updateViewportLeft = useCallback((left: number) => {
        setViewState((prev: ViewState) => ({ ...prev, viewportLeft: left }));
    }, []);

    const scrollToTime = useCallback(
        (time: number) => {
            const pixelPosition = time * viewState.zoomLevel;
            const centeredPosition = pixelPosition - viewState.viewportWidth / 2;
            const clampedPosition = Math.max(0, centeredPosition);
            updateViewportLeft(clampedPosition);
        },
        [viewState.zoomLevel, viewState.viewportWidth, updateViewportLeft],
    );

    const zoomToFit = useCallback(
        (totalDuration: number) => {
            if (viewState.viewportWidth > 0) {
                const newZoomLevel = (viewState.viewportWidth * 0.9) / totalDuration;
                setViewState((prev: ViewState) => ({
                    ...prev,
                    zoomLevel: Math.max(1, Math.min(100, newZoomLevel)), // Updated to use new max zoom
                    viewportLeft: 0,
                }));
            }
        },
        [viewState.viewportWidth],
    );

    // Memoized compatibility function
    const isSceneCompatibleWithTrackMemo = useMemo(
        () => isSceneCompatibleWithTrack,
        []
    );

    useEffect(() => {
        if (dragState.draggedScene) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [dragState.draggedScene, handleMouseMove, handleMouseUp]);

    return {
        dragState,
        viewState,
        setViewState,
        handleSceneMouseDown,
        handleLibrarySceneDragStart,
        handleTimelineDragOver,
        handleTimelineDragLeave,
        handleTimelineDrop,
        handleLibrarySceneDragEnd,
        updateViewportWidth,
        updateViewportLeft,
        scrollToTime,
        zoomToFit,
        isSceneCompatibleWithTrack: isSceneCompatibleWithTrackMemo,
        getValidTracksForScene,
    };
};
