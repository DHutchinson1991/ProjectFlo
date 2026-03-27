import { TimelineTrack } from '@/features/content/content-builder/types/timeline';

/**
 * Maps coverage assignments to their database IDs.
 * @param coverageItemsRaw The raw coverage items array from the scene.
 * @returns A Map where keys are assignment names (e.g. "Camera 1") and values are coverage IDs.
 */
export const mapCoverageToIds = (coverageItemsRaw: any[]): Map<string, number> => {
    const map = new Map<string, number>();
    try {
        if (!Array.isArray(coverageItemsRaw)) return map;
        
        coverageItemsRaw.forEach((item: any) => {
            if (item && item.assignment) {
                map.set(item.assignment, item.id);
            }
        });
    } catch (e) {
        console.error("Failed to map coverage items", e);
    }
    return map;
};

/**
 * Filters tracks to only those available for the moment based on coverage.
 * @param allTracks List of all timeline tracks.
 * @param coverageItemsRaw Coverage items from the scene.
 * @param coverageIdMap Map of assignment names to IDs (optional, for optimization).
 * @returns Filtered list of tracks.
 */
export const filterAvailableTracks = (
    allTracks: TimelineTrack[] | undefined,
    coverageItemsRaw: any[],
    coverageIdMap?: Map<string, number>
): TimelineTrack[] => {
    if (!allTracks) return [];
    if (!coverageItemsRaw || coverageItemsRaw.length === 0) return allTracks; // Fallback

    const map = coverageIdMap || mapCoverageToIds(coverageItemsRaw);

    return allTracks.filter(track => {
         // Keep track if its name matches a coverage assignment
         // OR if it's a generic type track that we want to allow (like Music often is implied)
         if (track.track_type === 'music' || track.track_type === 'graphics') return true; 
         return map.has(track.name);
    });
};
