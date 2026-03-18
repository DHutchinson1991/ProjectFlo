import { useState, useEffect, useCallback } from "react";
import { ViewState, TimelineScene } from '@/lib/types/timeline';
import { TIMELINE_CONFIG } from "@/app/(studio)/designer/components/ContentBuilder/config/constants";

/**
 * Hook for managing timeline viewport state and zoom functionality
 */
export const useViewportManager = () => {
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
            const targetZoomLevel = Math.max(1, (viewState.viewportWidth - TIMELINE_CONFIG.VIEWPORT_PADDING) / TIMELINE_CONFIG.AUTO_FIT_DURATION);

            // Only update if it's significantly different from current zoom
            if (Math.abs(viewState.zoomLevel - targetZoomLevel) > 1) {
                setViewState(prev => ({
                    ...prev,
                    zoomLevel: Math.round(targetZoomLevel * 2) / 2 // Round to nearest 0.5
                }));
            }
        }
    }, [viewState.viewportWidth]); // Only run when viewport width changes

    // Update viewport width when timeline container resizes
    const updateViewportWidth = useCallback((width: number) => {
        setViewState(prev => ({
            ...prev,
            viewportWidth: width
        }));
    }, []);

    // Zoom to fit functionality
    const zoomToFit = useCallback((totalDuration: number) => {
        if (viewState.viewportWidth > 0 && totalDuration > 0) {
            const targetZoomLevel = Math.max(
                TIMELINE_CONFIG.MIN_ZOOM_LEVEL,
                Math.min(
                    TIMELINE_CONFIG.MAX_ZOOM_LEVEL,
                    (viewState.viewportWidth - TIMELINE_CONFIG.VIEWPORT_PADDING) / totalDuration
                )
            );

            setViewState(prev => ({
                ...prev,
                zoomLevel: Math.round(targetZoomLevel * 2) / 2, // Round to nearest 0.5
                viewportLeft: 0 // Reset scroll position
            }));
        }
    }, [viewState.viewportWidth]);

    // Zoom controls
    const zoomIn = useCallback(() => {
        setViewState(prev => ({
            ...prev,
            zoomLevel: Math.min(TIMELINE_CONFIG.MAX_ZOOM_LEVEL, prev.zoomLevel + TIMELINE_CONFIG.ZOOM_STEP)
        }));
    }, []);

    const zoomOut = useCallback(() => {
        setViewState(prev => ({
            ...prev,
            zoomLevel: Math.max(TIMELINE_CONFIG.MIN_ZOOM_LEVEL, prev.zoomLevel - TIMELINE_CONFIG.ZOOM_STEP)
        }));
    }, []);

    const setZoomLevel = useCallback((zoom: number) => {
        const clampedZoom = Math.max(
            TIMELINE_CONFIG.MIN_ZOOM_LEVEL,
            Math.min(TIMELINE_CONFIG.MAX_ZOOM_LEVEL, zoom)
        );

        setViewState(prev => ({
            ...prev,
            zoomLevel: clampedZoom
        }));
    }, []);

    // Snap to grid toggle
    const toggleSnapToGrid = useCallback(() => {
        setViewState(prev => ({
            ...prev,
            snapToGrid: !prev.snapToGrid
        }));
    }, []);

    // Scene selection
    const selectScene = useCallback((scene: TimelineScene | null) => {
        setViewState(prev => ({
            ...prev,
            selectedScene: scene
        }));
    }, []);

    const clearSelection = useCallback(() => {
        setViewState(prev => ({
            ...prev,
            selectedScene: null
        }));
    }, []);

    // Viewport scrolling
    const scrollViewport = useCallback((deltaX: number) => {
        setViewState(prev => ({
            ...prev,
            viewportLeft: Math.max(0, prev.viewportLeft + deltaX)
        }));
    }, []);

    const setViewportLeft = useCallback((left: number) => {
        setViewState(prev => ({
            ...prev,
            viewportLeft: Math.max(0, left)
        }));
    }, []);

    return {
        viewState,
        setViewState,
        updateViewportWidth,
        zoomToFit,
        zoomIn,
        zoomOut,
        setZoomLevel,
        toggleSnapToGrid,
        selectScene,
        clearSelection,
        scrollViewport,
        setViewportLeft,
    };
};
