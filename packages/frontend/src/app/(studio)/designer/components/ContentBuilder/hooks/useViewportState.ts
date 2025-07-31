import { useState, useEffect, useCallback } from "react";
import { ViewState } from "../types/dragDropTypes";
import { TimelineScene } from "../types/sceneTypes";
import { TIMELINE_CONFIG } from "../config/constants";

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

    // Effect to adjust initial zoom level to fit 1 minute in viewport
    useEffect(() => {
        if (viewState.viewportWidth > 0) {
            // Calculate zoom level to make 60 seconds (1 minute) fit the viewport width
            // Leave some padding for better UX
            const targetZoomLevel = Math.max(
                TIMELINE_CONFIG.MIN_ZOOM_LEVEL,
                (viewState.viewportWidth - TIMELINE_CONFIG.VIEWPORT_PADDING) / TIMELINE_CONFIG.AUTO_FIT_DURATION
            );

            // Only update if it's significantly different from current zoom
            if (Math.abs(viewState.zoomLevel - targetZoomLevel) > 1) {
                setViewState(prev => ({
                    ...prev,
                    zoomLevel: Math.round(targetZoomLevel * 2) / 2 // Round to nearest 0.5
                }));
            }
        }
    }, [viewState.viewportWidth]); // Only run when viewport width changes

    // Update viewport width when container resizes
    const updateViewportWidth = useCallback((width: number) => {
        setViewState(prev => ({ ...prev, viewportWidth: width }));
    }, []);

    // Zoom to fit a specific duration in the viewport
    const zoomToFit = useCallback((totalDuration: number) => {
        const duration = Math.max(totalDuration, TIMELINE_CONFIG.AUTO_FIT_DURATION);
        const targetZoomLevel = Math.max(
            TIMELINE_CONFIG.MIN_ZOOM_LEVEL,
            Math.min(
                TIMELINE_CONFIG.MAX_ZOOM_LEVEL,
                (viewState.viewportWidth - TIMELINE_CONFIG.VIEWPORT_PADDING) / duration
            )
        );

        setViewState(prev => ({
            ...prev,
            zoomLevel: Math.round(targetZoomLevel * 2) / 2, // Round to nearest 0.5
            viewportLeft: 0 // Reset scroll position
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
    };
};
