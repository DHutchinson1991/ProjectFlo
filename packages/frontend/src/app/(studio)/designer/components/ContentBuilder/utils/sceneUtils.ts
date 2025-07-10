/**
 * Scene-related utility functions
 */
import * as React from "react";
import { TimelineScene, ScenesLibrary, MediaType } from "../types/sceneTypes";
import { SceneGroup } from "../types/sceneTypes";

/**
 * Gets the icon type for a scene based on its media type
 */
export const getSceneIconType = (type: string): string => {
    switch (type.toUpperCase()) {
        case "VIDEO": return "VideoIcon";
        case "AUDIO": return "AudioIcon";
        case "GRAPHICS": return "GraphicsIcon";
        case "MUSIC": return "MusicIcon";
        default: return "VideoIcon";
    }
};

/**
 * Gets the React icon component for a scene type
 */
export const getSceneIconComponent = (
    type: string,
    iconComponents: Record<string, React.ComponentType>
): React.ReactElement | null => {
    const iconType = getSceneIconType(type);
    const IconComponent = iconComponents[iconType];
    return IconComponent ? React.createElement(IconComponent) : null;
};

/**
 * Gets available scene categories for filtering
 */
export const getSceneCategories = () => [
    { id: "all", name: "All Scenes", count: 0 },
    { id: "video", name: "Video", count: 0 },
    { id: "audio", name: "Audio", count: 0 },
    { id: "graphics", name: "Graphics", count: 0 },
    { id: "music", name: "Music", count: 0 },
];

/**
 * Groups scenes by their group ID
 */
export const groupScenesByGroupId = (scenes: TimelineScene[]): Record<string, SceneGroup> => {
    const groups: Record<string, SceneGroup> = {};

    scenes.forEach(scene => {
        if (scene.group_id) {
            if (!groups[scene.group_id]) {
                groups[scene.group_id] = {
                    id: scene.group_id,
                    name: `Group ${scene.group_id}`,
                    scenes: [],
                    color: scene.color,
                    isCollapsed: false
                };
            }

            groups[scene.group_id].scenes.push(scene);
        }
    });

    return groups;
};

/**
 * Gets the group for a specific scene
 */
export const getGroupForScene = (
    scene: TimelineScene,
    sceneGroups: Record<string, SceneGroup>
): SceneGroup | null => {
    return scene.group_id ? sceneGroups[scene.group_id] || null : null;
};

/**
 * Checks if a scene is in a collapsed group
 */
export const isSceneInCollapsedGroup = (
    scene: TimelineScene,
    sceneGroups: Record<string, SceneGroup>
): boolean => {
    const group = getGroupForScene(scene, sceneGroups);
    return group ? (group.isCollapsed ?? false) && !scene.is_group_primary : false;
};

/**
 * Toggles the collapsed state of a group
 */
export const toggleGroupCollapsed = (
    groupId: string,
    sceneGroups: Record<string, SceneGroup>
): Record<string, SceneGroup> => {
    const updatedGroups = { ...sceneGroups };
    if (updatedGroups[groupId]) {
        updatedGroups[groupId] = {
            ...updatedGroups[groupId],
            isCollapsed: !updatedGroups[groupId].isCollapsed
        };
    }
    return updatedGroups;
};

/**
 * Determines the display type for a scene based on its media components
 * Returns the scene_type if available, otherwise infers from media components
 */
export const getSceneDisplayType = (scene: ScenesLibrary): string => {
    // If scene has a defined scene_type, use that
    if (scene.scene_type) {
        return scene.scene_type;
    }

    // If scene has multiple media components, it's a mixed scene
    if (scene.media_components && scene.media_components.length > 1) {
        return "MIXED";
    }

    // If scene has a single media component, use that type
    if (scene.media_components && scene.media_components.length === 1) {
        return scene.media_components[0].media_type;
    }

    // Fall back to the scene's primary type
    return scene.type;
};

/**
 * Gets the primary media type for a scene (for compatibility with existing systems)
 */
export const getScenePrimaryMediaType = (scene: ScenesLibrary): MediaType => {
    // Check if there's a primary media component
    const primaryComponent = scene.media_components?.find(c => c.is_primary);
    if (primaryComponent) {
        return primaryComponent.media_type;
    }

    // Fall back to the scene's type (should always be a valid MediaType from database)
    return scene.type;
};

/**
 * Gets all unique media types in a scene
 */
export const getSceneMediaTypes = (scene: ScenesLibrary): MediaType[] => {
    if (scene.media_components && scene.media_components.length > 0) {
        const uniqueTypes = [...new Set(scene.media_components.map(c => c.media_type))];
        return uniqueTypes;
    }

    return [scene.type];
};

/**
 * Determines if a scene has multiple media types
 */
export const isMultiMediaScene = (scene: ScenesLibrary): boolean => {
    return getSceneMediaTypes(scene).length > 1;
};
