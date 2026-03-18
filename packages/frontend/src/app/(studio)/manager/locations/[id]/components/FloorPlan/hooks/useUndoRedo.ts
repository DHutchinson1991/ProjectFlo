import { useState, useCallback } from 'react';

// Type for SVG.js drawing instance
interface SVGDrawing {
    svg(): string;
    svg(data: string): SVGDrawing;
    clear(): SVGDrawing;
}

export const useUndoRedo = () => {
    const [undoStack, setUndoStack] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const saveStateToUndoStack = useCallback((svgDrawing: SVGDrawing | null) => {
        if (!svgDrawing) return;

        try {
            const currentState = svgDrawing.svg();
            setUndoStack(prev => {
                const newStack = [...prev, currentState];
                // Limit undo stack size to prevent memory issues
                if (newStack.length > 50) {
                    newStack.shift();
                }
                return newStack;
            });
            setRedoStack([]); // Clear redo stack when new action is performed
            setCanUndo(true);
            setCanRedo(false);
        } catch (error) {
            console.warn('Error saving state to undo stack:', error);
        }
    }, []);

    const handleUndo = useCallback((svgDrawing: SVGDrawing | null) => {
        if (!svgDrawing || undoStack.length === 0) return;

        try {
            const currentState = svgDrawing.svg();
            const previousState = undoStack[undoStack.length - 1];

            // Save current state to redo stack
            setRedoStack(prev => [...prev, currentState]);

            // Remove last state from undo stack
            setUndoStack(prev => {
                const newStack = prev.slice(0, -1);
                setCanUndo(newStack.length > 0);
                return newStack;
            });

            setCanRedo(true);

            // Restore previous state
            svgDrawing.clear();
            svgDrawing.svg(previousState);

            console.log('🔄 Undo performed');
        } catch (error) {
            console.error('Error during undo:', error);
        }
    }, [undoStack]);

    const handleRedo = useCallback((svgDrawing: SVGDrawing | null) => {
        if (!svgDrawing || redoStack.length === 0) return;

        try {
            const currentState = svgDrawing.svg();
            const nextState = redoStack[redoStack.length - 1];

            // Save current state to undo stack
            setUndoStack(prev => [...prev, currentState]);

            // Remove last state from redo stack
            setRedoStack(prev => {
                const newStack = prev.slice(0, -1);
                setCanRedo(newStack.length > 0);
                return newStack;
            });

            setCanUndo(true);

            // Restore next state
            svgDrawing.clear();
            svgDrawing.svg(nextState);

            console.log('🔄 Redo performed');
        } catch (error) {
            console.error('Error during redo:', error);
        }
    }, [redoStack]);

    const clearHistory = useCallback(() => {
        setUndoStack([]);
        setRedoStack([]);
        setCanUndo(false);
        setCanRedo(false);
    }, []);

    return {
        // State
        undoStack,
        redoStack,
        canUndo,
        canRedo,

        // Actions
        saveStateToUndoStack,
        handleUndo,
        handleRedo,
        clearHistory,
    };
};
