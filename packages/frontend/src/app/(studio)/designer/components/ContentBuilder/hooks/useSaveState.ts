import { useState, useEffect, useCallback } from "react";
import { TimelineScene } from "../types/sceneTypes";
import { SaveState } from "../types/controlTypes";

/**
 * Hook for managing save state and unsaved changes detection
 */
export const useSaveState = (
    scenes: TimelineScene[],
    onSave?: (scenes: TimelineScene[]) => Promise<void> | void
) => {
    const [saveState, setSaveState] = useState<SaveState>({
        hasUnsavedChanges: false,
        lastSavedAt: null,
        isSaving: false,
        saveError: null,
    });

    const [lastSavedScenes, setLastSavedScenes] = useState<string>("");
    const [initialLoad, setInitialLoad] = useState(true);

    // Detect changes in scenes
    useEffect(() => {
        if (initialLoad) {
            // On first load, consider it as the "saved" state
            setLastSavedScenes(JSON.stringify(scenes));
            setInitialLoad(false);
            return;
        }

        const currentScenesString = JSON.stringify(scenes);
        const hasChanges = currentScenesString !== lastSavedScenes;

        setSaveState((prev: SaveState) => ({
            ...prev,
            hasUnsavedChanges: hasChanges,
            saveError: hasChanges ? null : prev.saveError, // Clear error when changes are detected
        }));
    }, [scenes, lastSavedScenes, initialLoad]);

    const handleSave = useCallback(async () => {
        if (!onSave || saveState.isSaving) return;

        setSaveState((prev: SaveState) => ({
            ...prev,
            isSaving: true,
            saveError: null,
        }));

        try {
            await onSave(scenes);

            // Update the "saved" state
            setLastSavedScenes(JSON.stringify(scenes));
            setSaveState((prev: SaveState) => ({
                ...prev,
                hasUnsavedChanges: false,
                lastSavedAt: new Date(),
                isSaving: false,
                saveError: null,
            }));
        } catch (error) {
            setSaveState((prev: SaveState) => ({
                ...prev,
                isSaving: false,
                saveError: error instanceof Error ? error.message : "Failed to save",
            }));
        }
    }, [onSave, scenes, saveState.isSaving]);

    const markAsSaved = useCallback(() => {
        setLastSavedScenes(JSON.stringify(scenes));
        setSaveState((prev: SaveState) => ({
            ...prev,
            hasUnsavedChanges: false,
            lastSavedAt: new Date(),
            saveError: null,
        }));
    }, [scenes]);

    return {
        saveState,
        handleSave,
        markAsSaved,
    };
};
