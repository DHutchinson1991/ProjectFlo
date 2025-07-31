import { useState, useCallback } from "react";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { TimelineScene, ScenesLibrary } from "../types/sceneTypes";
import { ViewState } from "../types/dragDropTypes";
import { TimelineTrack } from "../types/timelineTypes";
import {
    findAvailableSpaceOnTrack,
    createTimelineScenesFromLibraryScene
} from "../utils";

/**
 * Hook for handling drag and drop events in the ContentBuilder
 */
export const useContentBuilderDragHandlers = (
    scenes: TimelineScene[],
    setScenes: React.Dispatch<React.SetStateAction<TimelineScene[]>>,
    tracks: TimelineTrack[],
    viewState: ViewState,
    timelineRef: React.RefObject<HTMLDivElement>
) => {
    // Active drag item state
    const [activeDragItem, setActiveDragItem] = useState<{
        scene: ScenesLibrary | TimelineScene;
        isFromLibrary: boolean;
    } | null>(null);

    // Handle drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;

        // Check if it's a library scene (from data transfer) or timeline scene
        if (active.data.current?.type === 'library-scene') {
            const scene = active.data.current.scene as ScenesLibrary;
            setActiveDragItem({ scene, isFromLibrary: true });
        } else if (active.data.current?.type === 'timeline-scene') {
            const scene = active.data.current.scene as TimelineScene;
            setActiveDragItem({ scene, isFromLibrary: false });
        }
    }, []);

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.data.current && over.data.current) {
            // Handle dropping on timeline tracks
            if (over.data.current.type === 'timeline-track') {
                const trackId = over.data.current.trackId as number;

                // Calculate drop position based on mouse coordinates
                const timelineElement = timelineRef.current;
                if (!timelineElement) return;

                const timelineRect = timelineElement.getBoundingClientRect();
                const activatorEvent = event.activatorEvent as MouseEvent | PointerEvent;
                const mouseX = activatorEvent?.clientX || 0;
                const relativeX = mouseX - timelineRect.left + viewState.viewportLeft;
                const dropPosition = { x: relativeX, y: 0 };

                if (active.data.current.type === 'library-scene') {
                    // Adding new scene from library
                    const libraryScene = active.data.current.scene as ScenesLibrary;
                    handleLibrarySceneDrop(libraryScene, trackId, dropPosition);
                } else if (active.data.current.type === 'timeline-scene') {
                    // Moving existing scene
                    const timelineScene = active.data.current.scene as TimelineScene;
                    handleTimelineSceneMove(timelineScene, trackId, dropPosition);
                }
            }
        }

        setActiveDragItem(null);
    }, [scenes, tracks, viewState.viewportLeft, viewState.zoomLevel, timelineRef]);

    // Handle drag over (for real-time feedback)
    const handleDragOver = useCallback(() => {
        // This can be used for real-time visual feedback
        // For now, we'll keep the existing logic in the timeline component
    }, []);

    // Helper function for library scene drop
    const handleLibrarySceneDrop = useCallback((
        scene: ScenesLibrary,
        trackId: number,
        position: { x: number; y: number }
    ) => {
        const preferredStartTime = Math.max(0, position.x / viewState.zoomLevel);

        // Use centralized utility to create timeline scenes from library scene
        const newScenes = createTimelineScenesFromLibraryScene(
            scene,
            tracks,
            preferredStartTime,
            scenes
        );

        // Add all new scenes
        if (newScenes.length > 0) {
            setScenes(prev => [...prev, ...newScenes]);
        }
    }, [scenes, tracks, viewState.zoomLevel, setScenes]);

    // Helper function for timeline scene move
    const handleTimelineSceneMove = useCallback((
        scene: TimelineScene,
        trackId: number,
        position: { x: number; y: number }
    ) => {
        const preferredStartTime = Math.max(0, position.x / viewState.zoomLevel);

        // Use centralized utility to find the best available spot, excluding the scene being moved
        const bestStartTime = findAvailableSpaceOnTrack(
            scenes,
            trackId,
            preferredStartTime,
            scene.duration,
            scene.id // Exclude the scene being moved from collision detection
        );

        setScenes(prev => prev.map(s =>
            s.id === scene.id
                ? { ...s, start_time: bestStartTime, track_id: trackId }
                : s
        ));
    }, [scenes, viewState.zoomLevel, setScenes]);

    return {
        activeDragItem,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
    };
};
