import { TimelineTrack } from "@/features/content/content-builder/types/timeline";

/**
 * Deep compares two coverage objects to determine if they are equal
 */
export const coverageEquals = (
    a: Record<string, boolean>,
    b: Record<string, boolean>
): boolean => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    for (const key of aKeys) {
        if (a[key] !== b[key]) {
            return false;
        }
    }

    return true;
};

/**
 * Calculates the initial coverage state for a moment based on available tracks and existing assignment data.
 * This handles bridging differences between the flat track list and nested assignment strings.
 */
export const calculateInitialCoverage = (
    moment: any, 
    allTracks: TimelineTrack[] = []
): Record<string, boolean> => {
    const currentCoverage = moment.coverage || {};
    const coverageItems = moment.coverage_items || [];
    const initialCoverage: Record<string, boolean> = {};

    if (allTracks.length > 0) {
        allTracks.forEach(track => {
            // Check if this track is assigned coverage in this moment
            // The coverage_items array from the API contains the actual assignments
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hasThisTrackAssignment = coverageItems.some((item: any) => {
                if (!item) return false;
                
                // The assignment field might be the camera/shot name
                const assignment = item.assignment || '';
                const coverageName = item.coverage?.name || '';
                
                // Match track name against either assignment or coverage name
                const trackNameLower = track.name.toLowerCase();
                
                return (
                    assignment.toLowerCase() === trackNameLower ||
                    coverageName.toLowerCase() === trackNameLower ||
                    assignment.toLowerCase().includes(trackNameLower) ||
                    trackNameLower.includes(assignment.toLowerCase())
                );
            });
            
            // Also check the coverage object (legacy support)
            const isInLegacyCoverage = 
                currentCoverage[track.name] === true ||
                currentCoverage[track.name.toUpperCase()] === true ||
                currentCoverage[track.name.toLowerCase()] === true;
            
            initialCoverage[track.name] = hasThisTrackAssignment || isInLegacyCoverage;
        });
    } else if (coverageItems.length > 0) {
        // Fallback: Use coverage items as-is if no tracks defined
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        coverageItems.forEach((item: any) => {
            const assignment = item.assignment || item.coverage?.name || '';
            if (assignment) {
                initialCoverage[assignment] = true;
            }
        });
    } else {
        // Fallback for legacy behavior with coverage object
        initialCoverage["VIDEO"] = currentCoverage["VIDEO"] === true;
        initialCoverage["AUDIO"] = currentCoverage["AUDIO"] === true;
        initialCoverage["GRAPHICS"] = currentCoverage["GRAPHICS"] === true;
        initialCoverage["MUSIC"] = currentCoverage["MUSIC"] === true;
    }

    return initialCoverage;
};
