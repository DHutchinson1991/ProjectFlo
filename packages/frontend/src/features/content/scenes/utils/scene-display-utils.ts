/**
 * Scene display utility functions - icons, labels, colors
 */
import type { ScenesLibrary } from "@/features/content/scenes/types";

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
 * Calculates a color hash for a scene (for visualization)
 */
export const getSceneColorHash = (sceneId: number | string): string => {
    const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
        "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
    ];

    const hash = String(sceneId).split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
};
