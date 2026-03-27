import { useState, useEffect, useCallback } from "react";
import { ViewState, TimelineScene } from '@/features/content/content-builder/types/timeline';
import { TIMELINE_CONFIG } from "../../constants/constants";

/**
 * Hook for managing timeline viewport state (zoom, scroll, selection)
 */
export const useViewportState = () => {
    const [viewState, setViewState] = useState<ViewState>({
        zoomLevel: TIMELINE_CONFIG.DEFAULT_ZOOM_LEVEL,
        snapToGrid: TIMELINE_CONFIG.SNAP_GRID_ENABLED,
        gridSize: TIMELINE_CONFIG.DEFAULT_GRID_SIZE,
        selectedScene: null,
        viewportLeft: 0,
        viewportWidth: TIMELINE_CONFIG.DEFAULT_VIEWPORT_WIDTH,
    });
    
    // Track if we've received the actual viewport width (initial width is often a default)
    const [hasReceivedRealViewportWidth, setHasReceivedRealViewportWidth] = useState(false);

    // Track when the real viewport width arrives (actual fitting handled elsewhere)
    useEffect(() => {
        if (!hasReceivedRealViewportWidth && viewState.viewportWidth > 0 &&
            viewState.viewportWidth !== TIMELINE_CONFIG.DEFAULT_VIEWPORT_WIDTH) {
            setHasReceivedRealViewportWidth(true);
        }
    }, [hasReceivedRealViewportWidth, viewState.viewportWidth]);

    // Update viewport width when container resizes
    const updateViewportWidth = useCallback((width: number) => {
        setViewState(prev => ({ ...prev, viewportWidth: width }));
    }, []);

    // Zoom to fit a specific duration in the viewport with 30% breathing room
    const zoomToFit = useCallback((totalDuration: number) => {
        // Show content + 30% extra so the timeline doesn't feel cramped
        const durationWithBreathing = Math.max(totalDuration, 30) * 1.3;
        const rawZoom = (viewState.viewportWidth - TIMELINE_CONFIG.VIEWPORT_PADDING) / durationWithBreathing;
        const targetZoomLevel = Math.max(
            TIMELINE_CONFIG.MIN_ZOOM_LEVEL,
            Math.min(TIMELINE_CONFIG.MAX_ZOOM_LEVEL, rawZoom)
        );
        // Fine-grained rounding: 3 decimal places at very low zoom, 2 at normal zoom
        const precision = targetZoomLevel < 0.5 ? 1000 : targetZoomLevel < 1 ? 100 : 10;
        const roundedZoom = Math.round(targetZoomLevel * precision) / precision;

        setViewState(prev => ({
            ...prev,
            zoomLevel: roundedZoom,
            viewportLeft: 0
        }));
    }, [viewState.viewportWidth]);

    // Zoom in/out by a specific factor
    const adjustZoom = useCallback((factor: number) => {
        setViewState(prev => ({
            ...prev,
            zoomLevel: Math.max(
                TIMELINE_CONFIG.MIN_ZOOM_LEVEL,
                Math.min(TIMELINE_CONFIG.MAX_ZOOM_LEVEL, prev.zoomLevel * factor)
            )
        }));
    }, []);

    // Set zoom to a specific level
    const setZoomLevel = useCallback((zoomLevel: number) => {
        setViewState(prev => ({
            ...prev,
            zoomLevel: Math.max(
                TIMELINE_CONFIG.MIN_ZOOM_LEVEL,
                Math.min(TIMELINE_CONFIG.MAX_ZOOM_LEVEL, zoomLevel)
            )
        }));
    }, []);

    // Toggle snap to grid
    const toggleSnapToGrid = useCallback(() => {
        setViewState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
    }, []);

    // Update grid size
    const setGridSize = useCallback((gridSize: number) => {
        setViewState(prev => ({ ...prev, gridSize: Math.max(1, gridSize) }));
    }, []);

    // Select a scene
    const selectScene = useCallback((scene: TimelineScene | null) => {
        setViewState(prev => ({ ...prev, selectedScene: scene }));
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setViewState(prev => ({ ...prev, selectedScene: null }));
    }, []);

    // Update viewport scroll position
    const setViewportLeft = useCallback((left: number) => {
        setViewState(prev => ({ ...prev, viewportLeft: Math.max(0, left) }));
    }, []);

    // Scroll timeline to show a specific time point
    const scrollToTime = useCallback(
        (time: number, totalDuration?: number) => {
            const pixelPosition = time * viewState.zoomLevel;
            const halfViewport = viewState.viewportWidth / 2;

            // Calculate the maximum scroll position (timeline end - viewport width)
            const timelineWidth = (totalDuration || 60) * viewState.zoomLevel;
            const maxScrollLeft = Math.max(0, timelineWidth - viewState.viewportWidth);

            // Try to center the playhead, but clamp to valid range
            let targetPosition = pixelPosition - halfViewport;

            // Ensure we don't scroll past the beginning
            targetPosition = Math.max(0, targetPosition);

            // Ensure we don't scroll past the end - keeps playhead visible when at timeline end
            targetPosition = Math.min(maxScrollLeft, targetPosition);

            setViewportLeft(targetPosition);
        },
        [viewState.zoomLevel, viewState.viewportWidth, setViewportLeft],
    );

    return {
        viewState,
        setViewState,
        updateViewportWidth,
        zoomToFit,
        adjustZoom,
        setZoomLevel,
        toggleSnapToGrid,
        setGridSize,
        selectScene,
        clearSelection,
        setViewportLeft,
        scrollToTime,
    };
};
