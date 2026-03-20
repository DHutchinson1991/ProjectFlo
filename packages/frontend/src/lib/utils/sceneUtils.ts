/**
 * Scene-related utility functions for manipulation and display
 */
import { ScenesLibrary } from "@/lib/types/domains/scenes";

/**
 * Gets the icon type for a scene based on its type
 */
export const getSceneIconType = (sceneType: string): string => {
    const iconMap: Record<string, string> = {
        "MOMENTS": "list",
        "MONTAGE": "film",
        "CEREMONY": "ritual",
        "RECEPTION": "utensils",
        "GETTING_READY": "sparkles",
        "GUESTS": "users",
        "DETAILS": "zoom-in",
        "TRANSITIONS": "arrow-right",
        "CREDITS": "film",
        "OTHER": "image"
    };

    return iconMap[sceneType] || "image";
};

/**
 * Groups scenes by a specific property (e.g., groupId)
 */
export const groupScenesByGroupId = (
    scenes: ScenesLibrary[]
): Record<string | number, ScenesLibrary[]> => {
    return scenes.reduce((groups, scene) => {
        // Assuming scenes have a group_id property
        const groupKey = (scene as any).group_id || "ungrouped";

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }

        groups[groupKey].push(scene);
        return groups;
    }, {} as Record<string | number, ScenesLibrary[]>);
};

/**
 * Gets the display type for a scene (used for UI labeling)
 */
export const getSceneDisplayType = (scene: ScenesLibrary): string => {
    const displayNames: Record<string, string> = {
        "MOMENTS": "Moments",
        "MONTAGE": "Montage",
        "CEREMONY": "Ceremony",
        "RECEPTION": "Reception",
        "GETTING_READY": "Getting Ready",
        "GUESTS": "Guests",
        "DETAILS": "Details",
        "TRANSITIONS": "Transitions",
        "CREDITS": "Credits",
        "OTHER": "Other"
    };

    return (scene.type && displayNames[scene.type]) || scene.type || 'Unknown';
};

/**
 * Gets the primary media type for a scene
 */
export const getScenePrimaryMediaType = (scene: ScenesLibrary): string | null => {
    const mediaTypes = getSceneMediaTypes(scene);
    return mediaTypes.length > 0 ? mediaTypes[0] : null;
};

/**
 * Gets all media types used in a scene
 */
export const getSceneMediaTypes = (scene: ScenesLibrary): string[] => {
    const mediaTypes = new Set<string>();

    // Check if scene has media_types property (from backend)
    if ((scene as any).media_types) {
        const types = (scene as any).media_types;
        if (Array.isArray(types)) {
            types.forEach(type => mediaTypes.add(type));
        }
    }

    // Infer from moments if available
    if ((scene as any).moments) {
        (scene as any).moments.forEach((moment: any) => {
            if (moment.media_type) {
                mediaTypes.add(moment.media_type);
            }
        });
    }

    return Array.from(mediaTypes);
};

/**
 * Checks if a scene uses multiple media types
 */
export const isMultiMediaScene = (scene: ScenesLibrary): boolean => {
    return getSceneMediaTypes(scene).length > 1;
};

/**
 * Calculates a color hash for a scene (for visualization)
 */
export const getSceneColorHash = (sceneId: number | string): string => {
    const colors = [
        "#FF6B6B", // Red
        "#4ECDC4", // Teal
        "#45B7D1", // Blue
        "#FFA07A", // Light Salmon
        "#98D8C8", // Mint
        "#F7DC6F", // Yellow
        "#BB8FCE", // Purple
        "#85C1E2"  // Sky Blue
    ];

    const hash = String(sceneId).split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
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
