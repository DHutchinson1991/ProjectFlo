import { useState, useEffect, useCallback } from "react";
import { TimelineScene, TimelineTrack, DragState } from '@/features/content/content-builder/types/timeline';
import { ScenesLibrary } from '@/features/content/scenes/types';
import { createTimelineScenesFromLibraryScene } from "../../utils/dragDropUtils";

/**
 * Local helper - checks if a scene type is compatible with a track type
 * This uses string-based parameters for internal compatibility checks
 */
const isSceneCompatibleWithTrack = (sceneType: string, trackType: string): boolean => {
    const typeRestrictions: Record<string, string[]> = {
        "MOMENTS": ["MAIN", "MOMENTS", "COVERAGE"],
        "MONTAGE": ["MAIN", "MOMENTS", "COVERAGE"],
        "CEREMONY": ["MAIN", "MOMENTS"],
        "RECEPTION": ["MAIN", "MOMENTS", "COVERAGE"],
        "GETTING_READY": ["MAIN", "MOMENTS", "COVERAGE"],
        "GUESTS": ["COVERAGE", "MOMENTS"],
        "DETAILS": ["COVERAGE", "MOMENTS"],
        "TRANSITIONS": ["MAIN", "MOMENTS"],
        "CREDITS": ["MAIN"],
        "VIDEO": ["MAIN", "MOMENTS", "COVERAGE"],
        "GRAPHICS": ["MAIN", "MOMENTS"],
        "AUDIO": ["MAIN", "MOMENTS"],
        "MUSIC": ["MAIN", "MOMENTS"],
        "MOMENTS_CONTAINER": ["MAIN", "MOMENTS"]
    };

    const allowedTracks = typeRestrictions[sceneType.toUpperCase()] || ["MAIN", "MOMENTS", "COVERAGE"];
    return allowedTracks.includes(trackType?.toUpperCase());
};

interface UseTimelineDragDropProps {
    scenes: TimelineScene[];
    setScenes: React.Dispatch<React.SetStateAction<TimelineScene[]>>;
    tracks: TimelineTrack[];
    zoomLevel: number;
    gridSize: number;
    snapToGrid: boolean;
    timelineRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for managing drag and drop operations on the timeline
 * Handles collision detection, track compatibility, and drop zone calculations
 */
export const useTimelineDragDrop = ({
    scenes,
    setScenes,
    tracks,
    zoomLevel,
    gridSize,
    snapToGrid,
    timelineRef,
}: UseTimelineDragDropProps) => {
    const [dragState, setDragState] = useState<DragState>({
        draggedScene: null,
        draggedLibraryScene: null,
        dragOffset: { x: 0, y: 0 },
        isDragActive: false,
        hasCollision: false,
        previewPosition: undefined,
    });

    const handleSceneMouseDown = (e: React.MouseEvent, scene: TimelineScene) => {
        if (e.button !== 0) return; // Only handle left mouse button

        e.preventDefault();
        e.stopPropagation();

        const timelineRect = timelineRef?.current?.getBoundingClientRect();
        if (!timelineRect) return;

        const offsetX =
            e.clientX - (timelineRect.left + scene.start_time * zoomLevel);
        const offsetY = e.clientY - timelineRect.top;

        setDragState({
            draggedScene: scene,
            draggedLibraryScene: null,
            dragOffset: { x: offsetX, y: offsetY },
            isDragActive: true,
            hasCollision: false,
            previewPosition: undefined,
        });
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragState.draggedScene) return;

            const timelineRect = timelineRef?.current?.getBoundingClientRect();
            if (!timelineRect) return;

            const mouseX = e.clientX - timelineRect.left - dragState.dragOffset.x;
            const mouseY = e.clientY - timelineRect.top - dragState.dragOffset.y;

            let newStartTime = mouseX / zoomLevel;
            if (snapToGrid) {
                newStartTime =
                    Math.round(newStartTime / gridSize) * gridSize;
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

            // Calculate the time offset from the dragged scene's original position
            const timeOffset = newStartTime - dragState.draggedScene.start_time;

            // Get all scenes with the same name (grouped scenes)
            const sceneName = dragState.draggedScene.name;
            const scenesWithSameName = scenes.filter((s) => s.name === sceneName);

            // Check for collisions with any scene in the dragged group
            const hasCollision = scenes.some((scene) => {
                // Skip collision check for scenes in the same group (they move together)
                if (scenesWithSameName.some((s) => s.id === scene.id)) return false;
                if (scene.track_id !== targetTrackId) return false;

                // For collision detection on the specific dragged scene
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
                    return prevScenes.map((scene) => {
                        // Move all scenes with the same name by the same time offset
                        if (scene.name === sceneName) {
                            return { 
                                ...scene, 
                                start_time: Math.max(0, scene.start_time + timeOffset),
                                // Keep each scene in its original track
                                track_id: scene.track_id 
                            };
                        }
                        return scene;
                    });
                });
            }
        },
        [
            dragState.draggedScene,
            dragState.dragOffset,
            zoomLevel,
            snapToGrid,
            gridSize,
            tracks,
            scenes,
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
        handleSceneMouseDown,
        isSceneCompatibleWithTrack,
        getValidTracksForScene,
    };
};
