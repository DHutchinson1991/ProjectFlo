/**
 * Scene data utility functions - media types, sorting, filtering
 */
import type { ScenesLibrary } from "@/features/content/scenes/types";

/**
 * Groups scenes by a specific property (e.g., groupId)
 */
export const groupScenesByGroupId = (
    scenes: ScenesLibrary[]
): Record<string | number, ScenesLibrary[]> => {
    return scenes.reduce((groups, scene) => {
        const groupKey = (scene as unknown as Record<string, unknown>).group_id as string | number || "ungrouped";

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }

        groups[groupKey].push(scene);
        return groups;
    }, {} as Record<string | number, ScenesLibrary[]>);
};

/**
 * Gets all media types used in a scene
 */
export const getSceneMediaTypes = (scene: ScenesLibrary): string[] => {
    const mediaTypes = new Set<string>();
    const record = scene as unknown as Record<string, unknown>;

    if (record.media_types) {
        const types = record.media_types;
        if (Array.isArray(types)) {
            types.forEach((type: string) => mediaTypes.add(type));
        }
    }

    if (Array.isArray(record.moments)) {
        record.moments.forEach((moment: Record<string, unknown>) => {
            if (typeof moment.media_type === 'string') {
                mediaTypes.add(moment.media_type);
            }
        });
    }

    return Array.from(mediaTypes);
};

/**
 * Gets the primary media type for a scene
 */
export const getScenePrimaryMediaType = (scene: ScenesLibrary): string | null => {
    const mediaTypes = getSceneMediaTypes(scene);
    return mediaTypes.length > 0 ? mediaTypes[0] : null;
};

/**
 * Checks if a scene uses multiple media types
 */
export const isMultiMediaScene = (scene: ScenesLibrary): boolean => {
    return getSceneMediaTypes(scene).length > 1;
};

/**
 * Sorts scenes by a specific property
 */
export const sortScenesByProperty = (
    scenes: ScenesLibrary[],
    property: keyof ScenesLibrary,
    ascending: boolean = true
): ScenesLibrary[] => {
    const sorted = [...scenes];

    sorted.sort((a, b) => {
        const valueA = a[property];
        const valueB = b[property];

        if (valueA === undefined || valueA === null) return 1;
        if (valueB === undefined || valueB === null) return -1;

        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    });

    return sorted;
};

/**
 * Filters scenes by multiple criteria
 */
export const filterScenes = (
    scenes: ScenesLibrary[],
    filters: Partial<{
        type: string;
        mediaType: string;
        hasMultipleMedia: boolean;
    }>
): ScenesLibrary[] => {
    return scenes.filter(scene => {
        if (filters.type && scene.type !== filters.type) return false;

        if (filters.mediaType) {
            const mediaTypes = getSceneMediaTypes(scene);
            if (!mediaTypes.includes(filters.mediaType)) return false;
        }

        if (filters.hasMultipleMedia !== undefined) {
            if (isMultiMediaScene(scene) !== filters.hasMultipleMedia) return false;
        }

        return true;
    });
};
