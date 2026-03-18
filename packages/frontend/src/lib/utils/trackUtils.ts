/**
 * Track-related utility functions for compatibility checking
 */
import { TimelineScene, TimelineTrack } from "@/lib/types/timeline";
import { ScenesLibrary } from "@/lib/types/domains/scenes";
import { getDefaultTrackColor } from "@/app/(studio)/designer/components/ContentBuilder/utils/colorUtils";

/**
 * Transforms a backend track object to a frontend TimelineTrack object
 */
export const transformBackendTrack = (track: any): TimelineTrack => {
    const rawType = track.type || track.track_type || track.trackType || "VIDEO";
    const rawName = track.name || track.track_label || track.label || `${rawType} Track`;
    const normalizedType = String(rawType).toLowerCase();
    return {
        id: track.id,
        name: rawName,
        track_type: normalizedType as any, // VIDEO -> video, AUDIO -> audio
        height: 60,
        visible: track.is_active !== false && track.isActive !== false,
        muted: false,
        color: getDefaultTrackColor(normalizedType),
        order_index: track.order_index ?? track.orderIndex ?? 0,
        contributor_id: track.contributor_id ?? null,
        contributor: track.contributor ?? null,
        is_unmanned: track.is_unmanned ?? null,
    };
};

/**
 * Determines if a scene type is compatible with a track
 */
export const isSceneCompatibleWithTrack = (
    scene: ScenesLibrary,
    track: TimelineTrack
): boolean => {
    // Define compatibility rules based on scene type and track
    const typeRestrictions: Record<string, string[]> = {
        "MOMENTS": ["MAIN", "MOMENTS", "COVERAGE"],
        "MONTAGE": ["MAIN", "MOMENTS", "COVERAGE"],
        "CEREMONY": ["MAIN", "MOMENTS"],
        "RECEPTION": ["MAIN", "MOMENTS", "COVERAGE"],
        "GETTING_READY": ["MAIN", "MOMENTS", "COVERAGE"],
        "GUESTS": ["COVERAGE", "MOMENTS"],
        "DETAILS": ["COVERAGE", "MOMENTS"],
        "TRANSITIONS": ["MAIN", "MOMENTS"],
        "CREDITS": ["MAIN"]
    };

    const allowedTracks = typeRestrictions[scene.type] || ["MAIN", "MOMENTS", "COVERAGE"];
    return allowedTracks.includes(track.track_type);
};

/**
 * Gets all compatible tracks for a given scene
 */
export const getCompatibleTracks = (
    scene: ScenesLibrary,
    tracks: TimelineTrack[]
): TimelineTrack[] => {
    return tracks.filter(track => isSceneCompatibleWithTrack(scene, track));
};

/**
 * Finds the best track for a scene based on availability and type
 */
export const findBestTrackForSceneType = (
    scene: ScenesLibrary,
    tracks: TimelineTrack[],
    existingScenes: TimelineScene[]
): TimelineTrack | null => {
    const compatibleTracks = getCompatibleTracks(scene, tracks);

    if (compatibleTracks.length === 0) {
        return null;
    }

    // Priority: MAIN tracks first, then MOMENTS, then COVERAGE
    const trackPriority: Record<string, number> = {
        "MAIN": 0,
        "MOMENTS": 1,
        "COVERAGE": 2
    };

    compatibleTracks.sort((a, b) => {
        const priorityA = trackPriority[a.track_type] ?? 999;
        const priorityB = trackPriority[b.track_type] ?? 999;
        return priorityA - priorityB;
    });

    // Return the highest priority compatible track
    return compatibleTracks[0];
};
