import { useEffect } from "react";
import { TimelineScene } from "../types/sceneTypes";
import { ViewState } from "../types/dragDropTypes";

/**
 * Hook for handling keyboard shortcuts in the ContentBuilder
 */
export const useKeyboardShortcuts = (
    readOnly: boolean,
    viewState: ViewState,
    onSceneDelete: (scene: TimelineScene) => void
) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle keyboard shortcuts if not in read-only mode
            if (readOnly) return;

            // Handle Delete key for selected scene
            if (event.key === 'Delete' || event.key === 'Backspace') {
                const selectedScene = viewState.selectedScene;
                if (selectedScene) {
                    event.preventDefault();
                    onSceneDelete(selectedScene);
                }
            }

            // TODO: Add more keyboard shortcuts here
            // - Ctrl+Z for undo
            // - Ctrl+Y for redo
            // - Space for play/pause
            // - Ctrl+S for save
            // - Arrow keys for timeline navigation
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [readOnly, viewState.selectedScene, onSceneDelete]);
};
