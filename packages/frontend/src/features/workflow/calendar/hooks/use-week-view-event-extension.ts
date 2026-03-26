import { useState, useCallback, useEffect } from 'react';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { WeekViewExtensionState, WeekViewExtensionOperations, ExtensionOperationConfig } from '../types/week-view-extension.types';

/**
 * Custom hook for handling week view event extension operations
 * Manages event extending/resizing by dragging top/bottom handles
 */
export const useWeekViewEventExtension = (
    events: CalendarEvent[],
    config: ExtensionOperationConfig = {}
): WeekViewExtensionOperations => {
    const {
        onEventUpdate,
        pixelsPerHour = 80,
        snapToMinutes = 15,
        minDurationMinutes = 15
    } = config;

    // Extension state for resizing events
    const [extensionState, setExtensionState] = useState<WeekViewExtensionState | null>(null);

    // Track if we just finished extending to prevent click events
    const [justFinishedExtending, setJustFinishedExtending] = useState(false);

    // Track hovered event for visual feedback
    const [, setHoveredEvent] = useState<string | null>(null);

    // Start extension operation for event resizing
    const handleExtensionStart = useCallback((
        e: React.MouseEvent,
        event: CalendarEvent,
        direction: 'top' | 'bottom'
    ) => {
        e.stopPropagation();
        setExtensionState({
            eventId: event.id,
            direction,
            startY: e.clientY,
            originalStart: new Date(event.start),
            originalEnd: new Date(event.end),
            currentStart: null, // Don't set until there's actual movement
            currentEnd: null    // Don't set until there's actual movement
        });
    }, []);

    // Handle mouse move during extension
    const handleExtensionMove = useCallback((e: MouseEvent) => {
        if (!extensionState) return;

        const deltaY = e.clientY - extensionState.startY;

        // Increase threshold to prevent small movements from triggering changes
        if (Math.abs(deltaY) < 10) {
            return;
        }

        const pixelsPerMinute = pixelsPerHour / 60;
        const minutesDelta = Math.round(deltaY / pixelsPerMinute / snapToMinutes) * snapToMinutes;

        let newStart = new Date(extensionState.originalStart);
        let newEnd = new Date(extensionState.originalEnd);

        if (extensionState.direction === 'top') {
            // Dragging top edge - adjust start time from original position
            newStart = new Date(extensionState.originalStart.getTime() + minutesDelta * 60 * 1000);
            // Ensure minimum duration
            if (newStart >= extensionState.originalEnd) {
                newStart = new Date(extensionState.originalEnd.getTime() - minDurationMinutes * 60 * 1000);
            }
        } else {
            // Dragging bottom edge - adjust end time from original position
            newEnd = new Date(extensionState.originalEnd.getTime() + minutesDelta * 60 * 1000);
            // Ensure minimum duration
            if (newEnd <= extensionState.originalStart) {
                newEnd = new Date(extensionState.originalStart.getTime() + minDurationMinutes * 60 * 1000);
            }
        }

        // Only update if the calculated times are actually different from originals
        if (newStart.getTime() !== extensionState.originalStart.getTime() ||
            newEnd.getTime() !== extensionState.originalEnd.getTime()) {
            setExtensionState(prev => prev ? {
                ...prev,
                currentStart: newStart,
                currentEnd: newEnd
            } : null);
        }
    }, [extensionState, pixelsPerHour, snapToMinutes, minDurationMinutes]);

    // Handle extension end
    const handleExtensionEnd = useCallback(async () => {
        if (!extensionState || !extensionState.currentStart || !extensionState.currentEnd) return;

        // Set flag to prevent click events
        setJustFinishedExtending(true);

        try {
            // Find the event and update it
            const eventToUpdate = events.find(e => e.id === extensionState.eventId);
            if (eventToUpdate && onEventUpdate) {
                console.log('Event extended in week view:', {
                    id: eventToUpdate.id,
                    title: eventToUpdate.title,
                    originalStart: extensionState.originalStart,
                    originalEnd: extensionState.originalEnd,
                    newStart: extensionState.currentStart,
                    newEnd: extensionState.currentEnd
                });

                // Call the update function passed from parent
                await onEventUpdate(eventToUpdate.id, {
                    start: extensionState.currentStart,
                    end: extensionState.currentEnd
                });

                console.log('✅ Event updated successfully in week view');
            }
        } catch (error) {
            console.error('❌ Error updating event in week view:', error);
        } finally {
            setExtensionState(null);
            // Clear the flag after a short delay to allow the click event to be prevented
            setTimeout(() => setJustFinishedExtending(false), 100);
        }
    }, [extensionState, events, onEventUpdate]);

    // Add global mouse event listeners for extending
    useEffect(() => {
        if (extensionState) {
            document.addEventListener('mousemove', handleExtensionMove);
            document.addEventListener('mouseup', handleExtensionEnd);
            document.body.style.cursor = extensionState.direction === 'top' ? 'n-resize' : 's-resize';
            document.body.style.userSelect = 'none';

            return () => {
                document.removeEventListener('mousemove', handleExtensionMove);
                document.removeEventListener('mouseup', handleExtensionEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [extensionState, handleExtensionMove, handleExtensionEnd]);

    return {
        extensionState,
        handleExtensionStart,
        setHoveredEvent,
        justFinishedExtending
    };
};
