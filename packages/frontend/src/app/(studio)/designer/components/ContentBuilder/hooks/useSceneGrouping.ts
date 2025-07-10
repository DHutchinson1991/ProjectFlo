import { useState, useEffect, useCallback } from "react";
import { TimelineScene, SceneGroup } from "../types/sceneTypes";

/**
 * Hook for managing scene grouping and visual organization
 */
export const useSceneGrouping = (scenes: TimelineScene[]) => {
    const [sceneGroups, setSceneGroups] = useState<Map<string, SceneGroup>>(new Map());

    // Generate scene groups based on original_scene_id
    useEffect(() => {
        const groups = new Map<string, SceneGroup>();

        scenes.forEach((scene: TimelineScene) => {
            if (scene.original_scene_id) {
                const groupId = `group-${scene.original_scene_id}`;

                if (!groups.has(groupId)) {
                    // Find the primary scene (VIDEO component) to determine group name and color
                    const primaryScene = scenes.find((s: TimelineScene) =>
                        s.original_scene_id === scene.original_scene_id &&
                        s.scene_type === "video"
                    ) || scene;

                    groups.set(groupId, {
                        id: groupId,
                        originalSceneId: scene.original_scene_id,
                        name: primaryScene.name.replace(" - VIDEO", "").replace(" - AUDIO", "").replace(" - MUSIC", ""),
                        scenes: [],
                        color: primaryScene.color,
                        isCollapsed: false,
                    });
                }

                groups.get(groupId)!.scenes.push(scene);
            }
        });

        // Sort scenes within each group by track order
        groups.forEach((group: SceneGroup) => {
            group.scenes.sort((a: TimelineScene, b: TimelineScene) => {
                // Video -> Audio -> Music order
                const order: Record<string, number> = { video: 1, audio: 2, music: 3, graphics: 4 };
                return (order[a.scene_type] || 5) - (order[b.scene_type] || 5);
            });
        });

        setSceneGroups(groups);
    }, [scenes]);

    const toggleGroupCollapse = useCallback((groupId: string) => {
        setSceneGroups((prev: Map<string, SceneGroup>) => {
            const newGroups = new Map(prev);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, {
                    ...group,
                    isCollapsed: !group.isCollapsed,
                });
            }
            return newGroups;
        });
    }, []);

    const getGroupForScene = useCallback((scene: TimelineScene): SceneGroup | null => {
        if (!scene.original_scene_id) return null;
        return sceneGroups.get(`group-${scene.original_scene_id}`) || null;
    }, [sceneGroups]);

    const isSceneInCollapsedGroup = useCallback((scene: TimelineScene): boolean => {
        const group = getGroupForScene(scene);
        return group?.isCollapsed || false;
    }, [getGroupForScene]);

    return {
        sceneGroups,
        toggleGroupCollapse,
        getGroupForScene,
        isSceneInCollapsedGroup,
    };
};
