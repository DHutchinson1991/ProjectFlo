import { useCallback, useState } from "react";
import type { TimelineScene } from "@/lib/types/timeline";

interface UseSceneNameEditingProps {
    scenes: TimelineScene[];
    onUpdateScene?: (scene: TimelineScene) => void;
}

export const useSceneNameEditing = ({ scenes, onUpdateScene }: UseSceneNameEditingProps) => {
    const [editingSceneName, setEditingSceneName] = useState<string | null>(null);
    const [sceneNameDraft, setSceneNameDraft] = useState<string>("");

    const startSceneNameEdit = useCallback((sceneName: string) => {
        setEditingSceneName(sceneName);
        setSceneNameDraft(sceneName);
    }, []);

    const cancelSceneNameEdit = useCallback(() => {
        setEditingSceneName(null);
        setSceneNameDraft("");
    }, []);

    const saveSceneNameEdit = useCallback((sceneName: string) => {
        if (!onUpdateScene) {
            cancelSceneNameEdit();
            return;
        }

        const nextName = sceneNameDraft.trim();
        if (!nextName || nextName === sceneName) {
            cancelSceneNameEdit();
            return;
        }

        scenes
            .filter((scene) => scene.name === sceneName)
            .forEach((scene) => {
                onUpdateScene({ ...scene, name: nextName });
            });

        cancelSceneNameEdit();
    }, [cancelSceneNameEdit, onUpdateScene, sceneNameDraft, scenes]);

    return {
        editingSceneName,
        sceneNameDraft,
        setSceneNameDraft,
        startSceneNameEdit,
        cancelSceneNameEdit,
        saveSceneNameEdit,
    };
};
