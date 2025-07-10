/**
 * Track-related utility functions
 */
import { TimelineTrack } from "../types/timelineTypes";

/**
 * Checks if a scene type is compatible with a track type
 */
export const isSceneCompatibleWithTrack = (
    sceneType: string,
    trackType: string,
): boolean => {
    const compatibilityMap: Record<string, string[]> = {
        GRAPHICS: ["graphics"],
        VIDEO: ["video"],
        AUDIO: ["audio"],
        MUSIC: ["music"],
    };
    return compatibilityMap[sceneType.toUpperCase()]?.includes(trackType) ?? false;
};

/**
 * Gets tracks that are compatible with a given scene type
 */
export const getCompatibleTracks = (
    sceneType: string,
    tracks: TimelineTrack[]
): TimelineTrack[] => {
    return tracks.filter(track =>
        isSceneCompatibleWithTrack(sceneType, track.track_type)
    );
};

/**
 * Finds the best track for a given scene type
 */
export const findBestTrackForSceneType = (
    sceneType: string,
    tracks: TimelineTrack[]
): TimelineTrack | null => {
    const compatibleTracks = getCompatibleTracks(sceneType, tracks);

    if (compatibleTracks.length === 0) {
        return null;
    }

    // For now, return the first compatible track
    // In the future, this could consider track load, preferences, etc.
    return compatibleTracks[0];
};
