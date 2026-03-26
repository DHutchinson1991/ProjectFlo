/**
 * Track utility functions for timeline track management
 * Handles sorting, ordering, color mapping, and normalization
 */

import { getDefaultTrackColor } from "@/features/content/content-builder";

export type TrackType = 'video' | 'audio' | 'graphics' | 'music';

/**
 * Get track group order for sorting
 * Graphics -> Video -> Audio -> Music
 */
export const getTrackGroupOrder = (trackType: string): number => {
    switch (trackType.toLowerCase()) {
        case "graphics": return 0;
        case "video": return 1;
        case "audio": return 2;
        case "music": return 3;
        default: return 99;
    }
};

/**
 * Extract numeric suffix from track label (e.g., "Video 2" -> 2)
 */
export const getTrackNumberSuffix = (label?: string | null): number => {
    if (!label) return 0;
    const match = label.match(/(\d+)\s*$/);
    return match ? parseInt(match[1], 10) : 0;
};

/**
 * Sort tracks for timeline display
 * Groups by type, then by label number
 */
export const sortTracksForTimeline = <T extends { track_type?: string; track_label?: string; name?: string; order_index?: number }>(
    tracks: T[]
): T[] => {
    return [...tracks].sort((a, b) => {
        const typeA = (a.track_type || "").toLowerCase();
        const typeB = (b.track_type || "").toLowerCase();
        
        // First sort by track type group
        const groupDiff = getTrackGroupOrder(typeA) - getTrackGroupOrder(typeB);
        if (groupDiff !== 0) return groupDiff;

        const labelA = a.track_label || a.name || "";
        const labelB = b.track_label || b.name || "";
        const numA = getTrackNumberSuffix(labelA);
        const numB = getTrackNumberSuffix(labelB);

        // Video tracks: highest number first (Video 2, Video 1)
        if (typeA === "video" && typeB === "video") {
            if (numA !== numB) return numB - numA;
        }

        // Audio tracks: lowest number first (Audio 1, Audio 2)
        if (typeA === "audio" && typeB === "audio") {
            if (numA !== numB) return numA - numB;
        }

        // Fall back to order_index if available
        const orderA = a.order_index ?? 0;
        const orderB = b.order_index ?? 0;
        if (orderA !== orderB) return orderA - orderB;

        // Finally sort alphabetically
        return labelA.localeCompare(labelB);
    });
};

/**
 * Normalize tracks for ContentBuilder compatibility
 * Adds required properties and ensures proper typing
 */
export const normalizeTracksForTimeline = (tracks: any[]): any[] => {
    return tracks.map(track => {
        const trackType = (track.track_type?.toLowerCase() || 'video') as TrackType;
        return {
            ...track,
            track_type: trackType,
            name: track.track_label || track.track_type,
            visible: track.is_active !== false,
            muted: false,
            height: 60,
            color: getDefaultTrackColor(trackType)
        };
    });
};

/**
 * Get track ID for media type (legacy helper)
 */
export const getTrackIdForMediaType = (mediaType: string): number => {
    switch (mediaType.toUpperCase()) {
        case "VIDEO": return 1;
        case "AUDIO": return 2;
        case "MUSIC": return 3;
        case "GRAPHICS": return 4;
        default: return 1;
    }
};

/**
 * Get scene color by type (legacy helper)
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
