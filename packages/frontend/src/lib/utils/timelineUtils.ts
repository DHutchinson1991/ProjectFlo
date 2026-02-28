/**
 * Timeline-related utility functions for positioning, collision detection, and calculations
 */
import { TimelineScene, TimelineTrack } from "@/lib/types/timeline";

/**
 * Gets all scenes on a specific track, excluding a specified scene
 */
export const getScenesOnTrack = (
    scenes: TimelineScene[],
    trackId: number,
    excludeSceneId?: number | string
): TimelineScene[] => {
    return scenes
        .filter(scene =>
            scene.track_id === trackId &&
            (excludeSceneId === undefined || scene.id !== excludeSceneId)
        )
        .sort((a, b) => a.start_time - b.start_time);
};

/**
 * Checks if two scenes would collide
 */
export const scenesWouldCollide = (
    scene1Start: number,
    scene1Duration: number,
    scene2Start: number,
    scene2Duration: number
): boolean => {
    const scene1End = scene1Start + scene1Duration;
    const scene2End = scene2Start + scene2Duration;
    return !(scene1End <= scene2Start || scene2End <= scene1Start);
};

/**
 * Checks if a scene would collide with any scenes on a track
 */
export const wouldCollideWithScenesOnTrack = (
    scenes: TimelineScene[],
    trackId: number,
    startTime: number,
    duration: number,
    excludeSceneId?: number | string
): boolean => {
    const scenesOnTrack = getScenesOnTrack(scenes, trackId, excludeSceneId);

    return scenesOnTrack.some(scene =>
        scenesWouldCollide(startTime, duration, scene.start_time, scene.duration)
    );
};

/**
 * Finds the best available space on a track for placing a scene
 */
export const findAvailableSpaceOnTrack = (
    scenes: TimelineScene[],
    trackId: number,
    preferredStartTime: number,
    duration: number,
    excludeSceneId?: number | string
): number => {
    // Get all scenes on this track, excluding the scene being moved
    const scenesOnTrack = getScenesOnTrack(scenes, trackId, excludeSceneId);

    // If no scenes on track, use preferred start time
    if (scenesOnTrack.length === 0) {
        return Math.max(0, preferredStartTime);
    }

    // Check if preferred position is available (no collision)
    const wouldCollideAtPreferred = wouldCollideWithScenesOnTrack(
        scenes, trackId, preferredStartTime, duration, excludeSceneId
    );

    if (!wouldCollideAtPreferred) {
        return Math.max(0, preferredStartTime);
    }

    // Find the best gap or append to end
    let bestStartTime = 0;

    // Check if we can fit at the beginning
    if (scenesOnTrack[0].start_time >= duration) {
        bestStartTime = Math.max(0, preferredStartTime);
        if (bestStartTime + duration <= scenesOnTrack[0].start_time) {
            return bestStartTime;
        }
        return 0; // Place at very beginning
    }

    // Check gaps between scenes
    for (let i = 0; i < scenesOnTrack.length - 1; i++) {
        const currentEnd = scenesOnTrack[i].start_time + scenesOnTrack[i].duration;
        const nextStart = scenesOnTrack[i + 1].start_time;
        const gapDuration = nextStart - currentEnd;

        if (gapDuration >= duration) {
            // We found a gap! Try to place close to preferred time if possible
            const gapStart = currentEnd;
            const gapEnd = nextStart - duration;

            if (preferredStartTime >= gapStart && preferredStartTime <= gapEnd) {
                return preferredStartTime; // Perfect fit in gap
            } else if (preferredStartTime < gapStart) {
                return gapStart; // Place at start of gap
            } else {
                return gapEnd; // Place at end of gap
            }
        }
    }

    // No gaps found, append to the end
    const lastScene = scenesOnTrack[scenesOnTrack.length - 1];
    return lastScene.start_time + lastScene.duration;
};

/**
 * Calculates the total duration of all scenes on the timeline
 */
export const calculateTimelineDuration = (
    scenes: TimelineScene[]
): number => {
    if (scenes.length === 0) return 0;

    const maxEndTime = Math.max(
        ...scenes.map(scene => scene.start_time + scene.duration)
    );

    return maxEndTime;
};

/**
 * Gets drop zones for a track based on existing scenes
 */
export const getDropZonesForTrack = (
    scenes: TimelineScene[],
    trackId: number,
    duration: number
): Array<{ startTime: number; endTime: number }> => {
    const scenesOnTrack = getScenesOnTrack(scenes, trackId);
    const dropZones: Array<{ startTime: number; endTime: number }> = [];

    if (scenesOnTrack.length === 0) {
        // Entire track is available
        dropZones.push({ startTime: 0, endTime: Infinity });
        return dropZones;
    }

    // Add drop zone at the beginning if there's space
    if (scenesOnTrack[0].start_time >= duration) {
        dropZones.push({
            startTime: 0,
            endTime: scenesOnTrack[0].start_time - duration
        });
    }

    // Add drop zones between scenes
    for (let i = 0; i < scenesOnTrack.length - 1; i++) {
        const currentEnd = scenesOnTrack[i].start_time + scenesOnTrack[i].duration;
        const nextStart = scenesOnTrack[i + 1].start_time;
        const gapDuration = nextStart - currentEnd;

        if (gapDuration >= duration) {
            dropZones.push({
                startTime: currentEnd,
                endTime: nextStart - duration
            });
        }
    }

    // Add drop zone at the end
    const lastScene = scenesOnTrack[scenesOnTrack.length - 1];
    dropZones.push({
        startTime: lastScene.start_time + lastScene.duration,
        endTime: Infinity
    });

    return dropZones;
};

/**
 * Snaps a time value to the nearest grid interval
 */
export const snapToGrid = (time: number, gridSize: number): number => {
    if (gridSize <= 0) return time;
    return Math.round(time / gridSize) * gridSize;
};

/**
 * Clamps a value between min and max bounds
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};
