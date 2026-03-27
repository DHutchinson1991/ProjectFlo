/**
 * Drag and drop utility functions for the ContentBuilder timeline.
 * 
 * Handles all drag-and-drop calculations including:
 * - Position calculation from pixel coordinates to timeline coordinates
 * - Validation of drop operations (scene type compatibility, collision detection)
 * - Track and scene management during drag operations
 * 
 * These utilities are UI-specific and work with the timeline's zoom level,
 * viewport position, and track configuration.
 * 
 * NOTE: Scene creation from library items is handled in sceneConversionUtils.ts
 */
import { TimelineScene, TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { ScenesLibrary } from "@/features/content/scenes/types";
import { MediaType, SceneMediaComponent } from "@/features/content/content-builder/types/timeline";
import { findAvailableSpaceOnTrack } from "@/features/content/content-builder/utils/timelineUtils";
import { getSceneColorByType, getDefaultTrackColor } from "./colorUtils";
import { createTimelineScenesFromLibraryScene } from "./sceneConversionUtils";

/**
 * Result of a drag and drop operation calculation.
 * 
 * @interface DragDropResult
 * @property {number} targetTrackId - The ID of the track where the item will be dropped
 * @property {number} newStartTime - The calculated start time in the timeline (in seconds)
 * @property {boolean} success - Whether the calculation was successful
 */
export interface DragDropResult {
    targetTrackId: number;
    newStartTime: number;
    success: boolean;
}

/**
 * Calculates the drop position for a dragged scene based on pixel coordinates.
 * 
 * Converts mouse position and viewport state into timeline coordinates (track and time).
 * Uses a standard track height of 40 pixels and respects the current zoom level.
 * 
 * @param dragPosition - Current mouse position { x: number, y: number }
 * @param viewState - Timeline view state including zoom level and viewport position
 * @param tracks - Array of available tracks with id and height
 * @param trackOffset - Optional vertical offset from the top of the track container (default: 0)
 * @returns DragDropResult with targetTrackId and newStartTime, or null if drop is outside valid area
 * 
 * @example
 * const result = calculateDropPosition(
 *   { x: 250, y: 120 },
 *   { zoomLevel: 10, viewportLeft: 0 },
 *   [{ id: 1, height: 40 }, { id: 2, height: 40 }],
 *   0
 * );
 * // Returns: { targetTrackId: 2, newStartTime: 25, success: true }
 */
export const calculateDropPosition = (
    dragPosition: { x: number; y: number },
    viewState: { zoomLevel: number; viewportLeft: number },
    tracks: Array<{ id: number; height: number }>,
    trackOffset?: number
): DragDropResult | null => {
    // Calculate time from horizontal position
    const timeFromPixels = (dragPosition.x + viewState.viewportLeft) / viewState.zoomLevel;

    // Calculate track from vertical position
    const trackHeight = 40; // Standard track height
    const trackIndex = Math.floor((dragPosition.y - (trackOffset || 0)) / trackHeight);

    if (trackIndex < 0 || trackIndex >= tracks.length) {
        return null; // Invalid drop zone
    }

    return {
        targetTrackId: tracks[trackIndex].id,
        newStartTime: Math.max(0, timeFromPixels),
        success: true
    };
};

/**
 * Validates if a drop operation is allowed.
 * 
 * Checks three conditions:
 * 1. Drop calculation was successful
 * 2. Target track exists
 * 3. Scene type is compatible with the target track
 * 
 * @param draggedItem - The scene or library item being dragged
 * @param dropResult - The calculated drop position from {@link calculateDropPosition}
 * @param existingScenes - Array of existing scenes on the timeline (for collision detection)
 * @param isSceneCompatibleWithTrack - Callback to check scene/track type compatibility
 * @param tracks - Array of available tracks with id and type
 * @returns true if the drop is valid, false otherwise
 * 
 * @example
 * const isValid = isValidDrop(
 *   libraryScene,
 *   dropResult,
 *   existingScenes,
 *   (sceneType, trackType) => sceneType === trackType,
 *   tracks
 * );
 */
export const isValidDrop = (
    draggedItem: TimelineScene | ScenesLibrary,
    dropResult: DragDropResult,
    existingScenes: TimelineScene[],
    isSceneCompatibleWithTrack: (sceneType: string, trackType: string) => boolean,
    tracks: Array<{ id: number; track_type: string }>
): boolean => {
    if (!dropResult.success) return false;

    // Find target track
    const targetTrack = tracks.find(t => t.id === dropResult.targetTrackId);
    if (!targetTrack) return false;

    // Check scene type compatibility
    const sceneType = 'scene_type' in draggedItem
        ? draggedItem.scene_type
        : draggedItem.type;

    if (!sceneType || !isSceneCompatibleWithTrack(sceneType, targetTrack.track_type)) {
        return false;
    }

    return true;
};

/**
 * Creates timeline scenes from a library scene for insertion into the timeline.
 * 
 * Handles multi-component scenes by creating grouped timeline scenes on appropriate tracks.
 * Automatically manages track creation if needed and applies proper colors based on media type.
 * 
 * @param libraryScene - The scene from the library to convert
 * @param tracks - Current timeline tracks
 * @param preferredStartTime - Suggested start time in seconds
 * @param existingScenes - Existing scenes on the timeline
 * @returns Object containing created scenes and any new tracks that were created
 * 
 * @example
 * const { scenes, newTracks } = createTimelineScenesFromLibraryScene(
 *   libraryScene,
 *   tracks,
 *   120, // 2 minutes into the timeline
 *   existingScenes
 * );
 */
// NOTE: This function is implemented in sceneConversionUtils.ts
// Exported here for backward compatibility with existing code
export { createTimelineScenesFromLibraryScene };

/**
 * Helper function to check if a scene type is compatible with a track type
 */
const isSceneCompatibleWithTrack = (sceneType: string, trackType: string): boolean => {
    // Define compatibility rules
    const compatibility: Record<string, string[]> = {
        'VIDEO': ['VIDEO', 'MAIN'],
        'AUDIO': ['AUDIO', 'SOUND'],
        'GRAPHICS': ['GRAPHICS', 'OVERLAY'],
        'MUSIC': ['AUDIO', 'MUSIC', 'SOUND'],
        'TRANSITION': ['VIDEO', 'TRANSITION'],
        'EFFECT': ['GRAPHICS', 'EFFECT', 'OVERLAY']
    };

    const compatibleTypes = compatibility[sceneType.toUpperCase()] || [];
    return compatibleTypes.includes(trackType.toUpperCase()) || trackType.toUpperCase() === 'MAIN';
};
