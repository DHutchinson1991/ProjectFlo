import { useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * Configuration constants for drag and drop sensors
 */
const DRAG_CONFIG = {
    ACTIVATION_DISTANCE: 8, // pixels required to start drag
} as const;

/**
 * Hook for configuring drag and drop sensors with consistent settings
 */
export const useDragSensors = () => {
    return useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: DRAG_CONFIG.ACTIVATION_DISTANCE,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
};
