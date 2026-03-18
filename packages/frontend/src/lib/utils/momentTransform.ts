/**
 * Moment data transformation utilities
 */
import { TimelineScene } from "@/lib/types/timeline";

/**
 * Transform a moment from API response to timeline representation
 */
export const transformMomentToTimelineScene = (
    moment: any,
    trackId: number,
    startTime: number = 0
): TimelineScene => {
    return {
        id: moment.id,
        timeline_id: 0, // Will be set by parent
        track_id: trackId,
        scene_id: moment.id,
        start_time: startTime,
        duration: moment.estimated_duration || 60,
        order_index: moment.order_index || 0,
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
};

/**
 * Transform timeline scene back to moment format for API
 */
export const transformTimelineSceneToMoment = (scene: TimelineScene): any => {
    return {
        id: scene.scene_id,
        start_time: scene.start_time,
        duration: scene.duration,
        order_index: scene.order_index,
        notes: scene.notes
    };
};

/**
 * Merge moment data with timeline positioning
 */
export const mergeMomentWithTimingData = (
    moment: any,
    startTime: number,
    duration: number
): any => {
    return {
        ...moment,
        start_time: startTime,
        duration: duration,
        end_time: startTime + duration
    };
};

/**
 * Calculate moment duration based on its components
 */
export const calculateMomentDuration = (moment: any): number => {
    // If moment has explicit duration, use it
    if (moment.estimated_duration) {
        return moment.estimated_duration;
    }

    // If moment has sub-moments or tasks, sum their durations
    if (moment.tasks && Array.isArray(moment.tasks)) {
        return moment.tasks.reduce((sum: number, task: any) => {
            return sum + (task.estimated_hours || 0) * 3600; // Convert hours to seconds
        }, 0);
    }

    // Default fallback
    return 60; // 1 minute default
};

/**
 * Sort moments by order index
 */
export const sortMomentsByOrder = (moments: any[]): any[] => {
    return [...moments].sort((a, b) => {
        const orderA = a.order_index ?? a.id ?? 0;
        const orderB = b.order_index ?? b.id ?? 0;
        return orderA - orderB;
    });
};

/**
 * Group moments by scene
 */
export const groupMomentsByScene = (
    moments: any[]
): Record<number | string, any[]> => {
    return moments.reduce((groups, moment) => {
        const sceneId = moment.scene_id || moment.id;

        if (!groups[sceneId]) {
            groups[sceneId] = [];
        }

        groups[sceneId].push(moment);
        return groups;
    }, {} as Record<number | string, any[]>);
};

/**
 * Validate moment data structure
 */
export const validateMomentData = (moment: any): boolean => {
    // Check required fields
    if (!moment || typeof moment !== "object") return false;
    if (moment.id === undefined || moment.id === null) return false;
    if (!moment.name && !moment.title) return false;

    return true;
};

/**
 * Clone a moment with optional overrides
 */
export const cloneMoment = (moment: any, overrides: Partial<any> = {}): any => {
    const cloned = { ...moment };

    // Deep clone nested arrays/objects
    if (moment.tasks && Array.isArray(moment.tasks)) {
        cloned.tasks = moment.tasks.map((task: any) => ({ ...task }));
    }

    if (moment.moments && Array.isArray(moment.moments)) {
        cloned.moments = moment.moments.map((subMoment: any) => ({ ...subMoment }));
    }

    // Apply overrides
    return { ...cloned, ...overrides };
};

/**
 * Calculate total duration of multiple moments
 */
export const calculateTotalDuration = (moments: any[]): number => {
    return moments.reduce((total, moment) => {
        return total + calculateMomentDuration(moment);
    }, 0);
};

/**
 * Check if moment overlaps with time range
 */
export const momentOverlapsWith = (
    moment: any,
    startTime: number,
    endTime: number
): boolean => {
    const momentStart = moment.start_time ?? 0;
    const momentEnd = momentStart + (moment.duration ?? calculateMomentDuration(moment));

    return !(momentEnd <= startTime || momentStart >= endTime);
};

/**
 * Transform film with moments into timeline format
 * Converts API response structure with scenes and moments to timeline-ready format
 */
export const transformFilmMomentsTimeline = (film: any): any => {
    if (!film || !film.film_scenes) {
        return { local_scenes: [] };
    }

    const localScenes = film.film_scenes.map((filmScene: any) => ({
        ...filmScene,
        original_scene: filmScene.scene || {},
        moments: (filmScene.scene?.moments || []).map((moment: any) => ({
            ...moment,
            duration: moment.duration || moment.estimated_duration || 0,
        })),
    }));

    return {
        ...film,
        local_scenes: localScenes,
    };
};
