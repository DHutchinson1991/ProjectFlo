import { useState, useEffect, useCallback, useRef } from "react";
import { TimelineScene, SaveState } from '@/features/content/content-builder/types/timeline';

const AUTO_SAVE_DELAY = 1500;

/**
 * Hook for managing save state with auto-save on change (debounced).
 * Automatically persists timeline changes after a short delay.
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
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);

    // Detect changes in scenes
    useEffect(() => {
        if (initialLoad) {
            setLastSavedScenes(JSON.stringify(scenes));
            setInitialLoad(false);
            return;
        }

        const currentScenesString = JSON.stringify(scenes);
        const hasChanges = currentScenesString !== lastSavedScenes;

        setSaveState((prev: SaveState) => ({
            ...prev,
            hasUnsavedChanges: hasChanges,
            saveError: hasChanges ? null : prev.saveError,
        }));
    }, [scenes, lastSavedScenes, initialLoad]);

    const executeSave = useCallback(async () => {
        if (!onSave || isSavingRef.current) return;

        isSavingRef.current = true;
        setSaveState((prev: SaveState) => ({ ...prev, isSaving: true, saveError: null }));

        try {
            await onSave(scenes);
            setLastSavedScenes(JSON.stringify(scenes));
            setSaveState((prev: SaveState) => ({
                ...prev,
                hasUnsavedChanges: false,
                lastSavedAt: new Date(),
                isSaving: false,
                saveError: null,
            }));
        } catch (error) {
            console.error('[AUTOSAVE] Save failed:', error);
            setSaveState((prev: SaveState) => ({
                ...prev,
                isSaving: false,
                saveError: error instanceof Error ? error.message : "Failed to save",
            }));
        } finally {
            isSavingRef.current = false;
        }
    }, [onSave, scenes]);

    // Auto-save when changes are detected (debounced)
    useEffect(() => {
        if (initialLoad || !saveState.hasUnsavedChanges || !onSave) return;

        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            executeSave();
        }, AUTO_SAVE_DELAY);

        return () => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        };
    }, [saveState.hasUnsavedChanges, initialLoad, executeSave, onSave]);

    // Flush pending auto-save on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current);
                autoSaveTimer.current = null;
            }
        };
    }, []);

    const handleSave = useCallback(async () => {
        if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = null;
        }
        await executeSave();
    }, [executeSave]);

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
