/**
 * Color-related utility functions for the ContentBuilder timeline and components.
 * 
 * Provides a consistent color palette for scene types and track types, ensuring
 * visual consistency across the timeline and library components.
 * 
 * Color Palette:
 * - VIDEO: Blue (#1e88e5 scenes, #1565c0 tracks)
 * - AUDIO: Green (#43a047 scenes, #1b5e20 tracks)
 * - GRAPHICS: Orange (#ff9800 both)
 * - MUSIC: Purple (#8e24aa scenes, #4a148c tracks)
 */

/**
 * Gets the hex color for a scene/component based on its media type.
 * 
 * Scene colors are brighter variants used for timeline scene blocks and library items.
 * 
 * @param type - The media type (VIDEO, AUDIO, GRAPHICS, MUSIC)
 * @returns Hex color code (e.g., "#1e88e5")
 * 
 * @example
 * const color = getSceneColorByType('VIDEO');
 * // Returns: "#1e88e5"
 */
export const getSceneColorByType = (type: string): string => {
    switch (type.toUpperCase()) {
        // Scenes (moments) slightly brighter than their tracks
        case "VIDEO": return "#1e88e5";   // brighter blue for clips
        case "AUDIO": return "#43a047";   // brighter green for clips
        case "GRAPHICS": return "#ff9800"; // unchanged
        case "MUSIC": return "#8e24aa";   // brighter purple for clips
        default: return "#2196f3";
    }
};

/**
 * Debug helper to log the entire color palette for a given context.
 * 
 * Useful for verifying that the color palette is being applied correctly
 * across scenes and tracks during development.
 * 
 * @param label - A label to identify the context (e.g., "Timeline Loaded", "Scene Selected")
 * 
 * @example
 * logPaletteDebug("Timeline Initialized");
 * // Outputs: 🎨 [PALETTE] Timeline Initialized { scene: {...}, tracks: {...} }
 */
export const logPaletteDebug = (label: string) => {
    console.log(`🎨 [PALETTE] ${label}`, {
        scene: {
            VIDEO: getSceneColorByType('VIDEO'),
            AUDIO: getSceneColorByType('AUDIO'),
            MUSIC: getSceneColorByType('MUSIC'),
            GRAPHICS: getSceneColorByType('GRAPHICS'),
        },
        tracks: {
            video: getDefaultTrackColor('video'),
            audio: getDefaultTrackColor('audio'),
            music: getDefaultTrackColor('music'),
            graphics: getDefaultTrackColor('graphics'),
        },
    });
};

/**
 * Alias for getSceneColorByType for backward compatibility.
 * 
 * Prefer using `getSceneColorByType` in new code.
 * 
 * @deprecated Use {@link getSceneColorByType} instead
 * @param type - The media type (VIDEO, AUDIO, GRAPHICS, MUSIC)
 * @returns Hex color code
 */
export const getSceneColor = (type: string): string => getSceneColorByType(type);

/**
 * Gets the hex color for a timeline track based on its type.
 * 
 * Track colors are darker variants used for the track backgrounds in the timeline.
 * 
 * @param trackType - The track type (video, audio, graphics, music)
 * @returns Hex color code (e.g., "#1565c0")
 * 
 * @example
 * const trackColor = getDefaultTrackColor('video');
 * // Returns: "#1565c0"
 */
export const getDefaultTrackColor = (trackType: string): string => {
    switch (trackType) {
        case "video": return "#1565c0";    // darker blue base
        case "audio": return "#1b5e20";    // darker green base
        case "graphics": return "#ff9800"; // unchanged
        case "music": return "#4a148c";    // darker purple base
        default: return "#757575";
    }
};
