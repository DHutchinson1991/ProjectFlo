import { useState, useCallback, useEffect } from "react";
import { ViewState } from '@/features/content/content-builder/types/timeline';

/**
 * Hook for managing timeline viewport state and navigation
 * Handles zoom, pan, grid snapping, and viewport dimensions
 */
export const useDragViewport = () => {
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

    // Update viewport width (usually from ResizeObserver or container size)
    const updateViewportWidth = useCallback((width: number) => {
        setViewState((prev: ViewState) => ({ ...prev, viewportWidth: width }));
    }, []);

    // Update viewport scroll position
    const updateViewportLeft = useCallback((left: number) => {
        setViewState((prev: ViewState) => ({ ...prev, viewportLeft: left }));
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

            updateViewportLeft(targetPosition);
        },
        [viewState.zoomLevel, viewState.viewportWidth, updateViewportLeft],
    );

    // Zoom to fit entire timeline duration in viewport
    const zoomToFit = useCallback(
        (totalDuration: number) => {
            const safeDuration = Number.isFinite(totalDuration) && totalDuration > 0 ? totalDuration : 60;
            if (viewState.viewportWidth > 0) {
                const newZoomLevel = (viewState.viewportWidth * 0.9) / safeDuration;
                setViewState((prev: ViewState) => ({
                    ...prev,
                    zoomLevel: Math.max(1, Math.min(100, newZoomLevel)), // Clamp between 1 and 100
                    viewportLeft: 0,
                }));
            }
        },
        [viewState.viewportWidth],
    );

    return {
        viewState,
        setViewState,
        updateViewportWidth,
        updateViewportLeft,
        scrollToTime,
        zoomToFit,
    };
};
