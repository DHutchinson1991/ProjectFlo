import { useState, useCallback } from "react";
import { DragState } from "../types/dragDropTypes";
import { TimelineScene, ScenesLibrary } from "../types/sceneTypes";
import { DRAG_DROP_CONFIG } from "../config/constants";

/**
 * Hook for managing drag and drop state
 */
export const useDragState = () => {
    const [dragState, setDragState] = useState<DragState>({
        draggedScene: null,
        draggedLibraryScene: null,
        dragOffset: { x: 0, y: 0 },
        isDragActive: false,
        hasCollision: false,
        previewPosition: undefined,
    });

    // Start dragging a timeline scene
    const startTimelineSceneDrag = useCallback((
        scene: TimelineScene,
        offset: { x: number; y: number }
    ) => {
        setDragState({
            draggedScene: scene,
            draggedLibraryScene: null,
            dragOffset: offset,
            isDragActive: true,
            hasCollision: false,
            previewPosition: undefined,
        });
    }, []);

    // Start dragging a library scene
    const startLibrarySceneDrag = useCallback((
        scene: ScenesLibrary,
        offset: { x: number; y: number } = { x: 0, y: 0 }
    ) => {
        setDragState({
            draggedScene: null,
            draggedLibraryScene: scene,
            dragOffset: offset,
            isDragActive: true,
            hasCollision: false,
            previewPosition: undefined,
        });
    }, []);

    // Update drag position and collision state
    const updateDragPosition = useCallback((
        startTime: number,
        trackId: number,
        hasCollision: boolean = false
    ) => {
        setDragState(prev => ({
            ...prev,
            previewPosition: { startTime, trackId },
            hasCollision,
        }));
    }, []);

    // End drag operation
    const endDrag = useCallback(() => {
        setDragState({
            draggedScene: null,
            draggedLibraryScene: null,
            dragOffset: { x: 0, y: 0 },
            isDragActive: false,
            hasCollision: false,
            previewPosition: undefined,
        });
    }, []);

    // Check if currently dragging
    const isDragging = dragState.isDragActive &&
        (dragState.draggedScene !== null || dragState.draggedLibraryScene !== null);

    // Check if dragging a timeline scene
    const isDraggingTimelineScene = isDragging && dragState.draggedScene !== null;

    // Check if dragging a library scene
    const isDraggingLibraryScene = isDragging && dragState.draggedLibraryScene !== null;

    // Get the scene being dragged (timeline or library)
    const getDraggedScene = useCallback(() => {
        return dragState.draggedScene || dragState.draggedLibraryScene;
    }, [dragState.draggedScene, dragState.draggedLibraryScene]);

    // Get drag feedback styling
    const getDragStyles = useCallback(() => ({
        opacity: isDragging ? DRAG_DROP_CONFIG.DRAG_OPACITY : 1,
        pointerEvents: isDragging ? 'none' : 'auto',
        transition: isDragging ? 'none' : 'opacity 150ms ease',
    }), [isDragging]);

    // Get drop preview styling
    const getDropPreviewStyles = useCallback((hasCollision: boolean = false) => ({
        opacity: DRAG_DROP_CONFIG.DROP_PREVIEW_OPACITY,
        backgroundColor: hasCollision ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)',
        border: hasCollision ? '2px solid #ff0000' : '2px solid #00ff00',
        pointerEvents: 'none',
    }), []);

    return {
        dragState,
        setDragState,
        startTimelineSceneDrag,
        startLibrarySceneDrag,
        updateDragPosition,
        endDrag,
        isDragging,
        isDraggingTimelineScene,
        isDraggingLibraryScene,
        getDraggedScene,
        getDragStyles,
        getDropPreviewStyles,
    };
};
