/**
 * Drag and drop configuration constants and helpers
 */

export const DRAG_CONFIG = {
    // Distance (in pixels) required before drag is activated
    ACTIVATION_DISTANCE: 8,
    
    // Track dimensions
    TRACK_HEIGHT_PIXELS: 40,
    AUDIO_TRACK_SEPARATOR_GAP: 24,
    
    // Grid snapping
    DEFAULT_GRID_SIZE: 5, // seconds
    DEFAULT_ZOOM_LEVEL: 5, // pixels per second
    MAX_ZOOM_LEVEL: 100,
    MIN_ZOOM_LEVEL: 1,
    
    // Default durations
    DEFAULT_SCENE_DURATION: 30, // seconds
    ONE_MINUTE_PADDING: 80, // pixels
} as const;

/**
 * Helper to calculate track layout based on track list
 */
export const calculateTrackLayout = (
    videoTracksCount: number,
    audioTracksCount: number
) => {
    return {
        videoSectionHeight: videoTracksCount * DRAG_CONFIG.TRACK_HEIGHT_PIXELS,
        audioSectionStart: videoTracksCount * DRAG_CONFIG.TRACK_HEIGHT_PIXELS + DRAG_CONFIG.AUDIO_TRACK_SEPARATOR_GAP,
        totalHeight: (videoTracksCount + audioTracksCount) * DRAG_CONFIG.TRACK_HEIGHT_PIXELS + DRAG_CONFIG.AUDIO_TRACK_SEPARATOR_GAP,
    };
};

/**
 * Helper to determine track index from mouse Y position
 */
export const getTrackIndexFromMouseY = (
    mouseY: number,
    videoTracksCount: number,
    audioTracksCount: number
): number => {
    if (mouseY < videoTracksCount * DRAG_CONFIG.TRACK_HEIGHT_PIXELS) {
        // In video/graphics section
        return Math.floor(mouseY / DRAG_CONFIG.TRACK_HEIGHT_PIXELS);
    }

    if (mouseY >= videoTracksCount * DRAG_CONFIG.TRACK_HEIGHT_PIXELS + DRAG_CONFIG.AUDIO_TRACK_SEPARATOR_GAP) {
        // In audio section (after separator gap)
        const audioY = mouseY - (videoTracksCount * DRAG_CONFIG.TRACK_HEIGHT_PIXELS + DRAG_CONFIG.AUDIO_TRACK_SEPARATOR_GAP);
        const audioIndex = Math.floor(audioY / DRAG_CONFIG.TRACK_HEIGHT_PIXELS);
        if (audioIndex >= 0 && audioIndex < audioTracksCount) {
            return videoTracksCount + audioIndex;
        }
    }

    return -1; // Invalid position
};
