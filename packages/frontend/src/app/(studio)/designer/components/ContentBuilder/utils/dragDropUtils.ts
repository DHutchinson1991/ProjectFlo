/**
 * Drag and drop utility functions
 */
import { TimelineScene, ScenesLibrary } from "../types";
import { MediaType, SceneMediaComponent } from "../types/sceneTypes";
import { findAvailableSpaceOnTrack } from "./timelineUtils";
import { getSceneColorByType } from "./colorUtils";

export interface DragDropResult {
    targetTrackId: number;
    newStartTime: number;
    success: boolean;
}

/**
 * Calculates the drop position for a dragged scene
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
 * Validates if a drop operation is valid
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

    if (!isSceneCompatibleWithTrack(sceneType, targetTrack.track_type)) {
        return false;
    }

    return true;
};

/**
 * Creates timeline scenes from a library scene, handling placement logic
 * If the scene has multiple media components, creates grouped timeline scenes
 */
export const createTimelineScenesFromLibraryScene = (
    libraryScene: ScenesLibrary,
    tracks: Array<{ id: number; track_type: string }>,
    preferredStartTime: number,
    existingScenes: TimelineScene[]
): TimelineScene[] => {
    const createdScenes: TimelineScene[] = [];
    const groupId = Date.now().toString(); // Unique group ID for all scenes from this library scene

    // Get media components - cast to proper type to access media_components
    const sceneWithComponents = libraryScene as typeof libraryScene & { media_components?: SceneMediaComponent[] };

    // Get actual media components or create a default one
    const mediaComponents = sceneWithComponents.media_components && sceneWithComponents.media_components.length > 0
        ? sceneWithComponents.media_components
        : [{
            id: 0,
            scene_id: libraryScene.id,
            media_type: libraryScene.type,
            duration_seconds: libraryScene.estimated_duration || 30,
            is_primary: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as SceneMediaComponent];

    // Create timeline scenes for each media component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaComponents.forEach((component: SceneMediaComponent | any, index: number) => {
        // Find a compatible track for this media component
        const compatibleTrack = tracks.find(track =>
            isSceneCompatibleWithTrack(component.media_type, track.track_type)
        );

        if (!compatibleTrack) {
            console.warn(`No compatible track found for media type: ${component.media_type}`);
            return; // Skip this component
        }

        // Find available space on the track
        const startTime = findAvailableSpaceOnTrack(
            [...existingScenes, ...createdScenes], // Include already created scenes to avoid conflicts
            compatibleTrack.id,
            preferredStartTime,
            component.duration_seconds || libraryScene.estimated_duration || 30
        );

        // Create the timeline scene for this media component
        const timelineScene: TimelineScene = {
            id: Date.now() + index, // Temporary ID - should be replaced when saved
            name: mediaComponents.length > 1
                ? `${libraryScene.name} (${component.media_type})`
                : libraryScene.name,
            scene_type: component.media_type.toLowerCase() as "video" | "audio" | "graphics" | "music",
            database_type: component.media_type,
            track_id: compatibleTrack.id,
            start_time: startTime,
            duration: component.duration_seconds || libraryScene.estimated_duration || 30,
            color: getSceneColorByType(component.media_type),
            description: libraryScene.description,
            group_id: mediaComponents.length > 1 ? groupId : undefined // Only group if multiple components
        };

        createdScenes.push(timelineScene);
    });

    return createdScenes;
};

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
