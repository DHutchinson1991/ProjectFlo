import { ViewState, TimelineScene } from '@/lib/types/timeline';

/**
 * Hook to calculate scene layout and position
 */
export const useSceneLayout = (scene: TimelineScene, viewState: ViewState) => {
    // Safety checks to prevent NaN
    const safeZoomLevel = viewState.zoomLevel || 5;
    const safeStartTime = scene.start_time ?? 0;
    const safeDuration = scene.duration || 0;
    
    // Calculate layout
    const width = safeDuration * safeZoomLevel;
    const left = safeStartTime * safeZoomLevel;

    // Visibility helpers
    const showText = width > 60;
    const showDeleteButton = width > 80;

    return {
        width,
        left,
        showText,
        showDeleteButton,
        zoomLevel: safeZoomLevel
    };
};
