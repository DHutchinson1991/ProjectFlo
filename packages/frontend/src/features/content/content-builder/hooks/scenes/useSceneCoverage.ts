import { useMemo } from 'react';
import { TimelineScene, TimelineTrack } from '@/features/content/content-builder/types/timeline';
import { mapCoverageToIds, filterAvailableTracks } from '../utils/sceneCoverageUtils';

/**
 * Hook to manage scene data parsing and coverage mapping
 */
export const useSceneCoverage = (scene: TimelineScene, allTracks?: TimelineTrack[]) => {
    // Map coverage assignments keys (like "Camera 1") to their database Coverage IDs
    // STABILIZATION FIX: Use JSON stringify fordependencies to prevent infinite loops from unstable object references
    const coverageItemsRaw = (scene as any).coverage_items || [];
    const coverageItemsStr = useMemo(() => JSON.stringify(coverageItemsRaw), [coverageItemsRaw]);

    const coverageIdMap = useMemo(() => {
        try {
            const items = JSON.parse(coverageItemsStr);
            return mapCoverageToIds(items);
        } catch (e) {
            console.error("Failed to parse coverage items string", e);
            return new Map<string, number>();
        }
    }, [coverageItemsStr]);

    // Filter available tracks to only those that exist in this scene's coverage
    // STABILIZATION FIX: Stabilize dependency on allTracks by using ID string
    const allTracksIds = allTracks ? allTracks.map(t => t.id).join(',') : '';

    const availableTracksForMoment = useMemo(() => {
        if (!allTracks) return [];
        
        let items = [];
        try {
            items = JSON.parse(coverageItemsStr);
        } catch (e) {
            items = []; // Fallback
        }
        
        return filterAvailableTracks(allTracks, items, coverageIdMap);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allTracksIds, coverageItemsStr, coverageIdMap]); 

    return { coverageIdMap, availableTracksForMoment };
};
