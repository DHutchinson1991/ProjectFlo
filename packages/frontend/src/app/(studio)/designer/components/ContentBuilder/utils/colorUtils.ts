/**
 * Color-related utility functions
 */

/**
 * Gets the color for a scene based on its media type
 */
export const getSceneColorByType = (type: string): string => {
    switch (type.toUpperCase()) {
        case "VIDEO": return "#2196f3";
        case "AUDIO": return "#4caf50";
        case "GRAPHICS": return "#ff9800";
        case "MUSIC": return "#9c27b0";
        default: return "#2196f3";
    }
};

/**
 * Alias for getSceneColorByType for backward compatibility
 */
export const getSceneColor = (type: string): string => getSceneColorByType(type);

/**
 * Gets the default color for a track based on its type
 */
export const getDefaultTrackColor = (trackType: string): string => {
    switch (trackType) {
        case "video": return "#2196f3";
        case "audio": return "#4caf50";
        case "graphics": return "#ff9800";
        case "music": return "#9c27b0";
        default: return "#757575";
    }
};
