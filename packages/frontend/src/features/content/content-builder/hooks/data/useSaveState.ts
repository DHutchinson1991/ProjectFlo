import { useState, useEffect, useCallback } from "react";
import { TimelineScene, SaveState } from '@/lib/types/timeline';

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
        if (!onSave || saveState.isSaving) {
            console.log('⚠️ [USESAVESTATE] Early exit - onSave missing or already saving');
            return;
        }

        console.log('💾 [USESAVESTATE] Starting save...');
        setSaveState((prev: SaveState) => ({
            ...prev,
            isSaving: true,
            saveError: null,
        }));

        try {
            console.log('💾 [USESAVESTATE] Calling onSave callback...');
            await onSave(scenes);
            console.log('✅ [USESAVESTATE] onSave callback completed successfully');

            // Update the "saved" state
            console.log('💾 [USESAVESTATE] Updating saved scenes state...');
            setLastSavedScenes(JSON.stringify(scenes));
            console.log('💾 [USESAVESTATE] Setting saveState to saved...');
            setSaveState((prev: SaveState) => {
                const newState = {
                    ...prev,
                    hasUnsavedChanges: false,
                    lastSavedAt: new Date(),
                    isSaving: false,
                    saveError: null,
                };
                console.log('💾 [USESAVESTATE] New save state:', newState);
                return newState;
            });
            console.log('✅ [USESAVESTATE] Save completed successfully');
        } catch (error) {
            console.error('❌ [USESAVESTATE] Save failed:', error);
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
