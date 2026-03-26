import { DragEndEvent } from '@dnd-kit/core';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { DragData, TimeSlotDropData } from '../types/drag-drop.types';

export interface DragDropHandlerProps {
    onEventUpdate?: (eventId: string, updateData: { start: Date; end: Date }) => Promise<void>;
}

/**
 * Handles drag and drop events for calendar components
 */
export const createDragDropHandler = ({ onEventUpdate }: DragDropHandlerProps) => {
    return async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        // Extract drag data from the active event
        const dragData = active.data.current as DragData;
        const dropData = over.data.current as TimeSlotDropData;

        if (!dragData || !dropData || dropData.type !== 'timeSlot') {
            console.warn('Invalid drag/drop data');
            return;
        }

        // Calculate the duration of the original event
        const originalDuration = dragData.originalEndTime.getTime() - dragData.originalStartTime.getTime();

        // Create new start time based on drop target
        const newStartTime = new Date(dropData.date);
        newStartTime.setHours(dropData.time, 0, 0, 0);

        // Create new end time preserving the original duration
        const newEndTime = new Date(newStartTime.getTime() + originalDuration);

        // Check if the event actually moved to a different time
        const originalStart = dragData.originalStartTime;
        const isSameTime = originalStart.getTime() === newStartTime.getTime();

        if (isSameTime) {
            console.log('Event dropped on same time slot, no update needed');
            return;
        }

        console.log('📅 Drag and drop event:', {
            eventId: dragData.event.id,
            eventTitle: dragData.event.title,
            originalStart: originalStart.toISOString(),
            originalEnd: dragData.originalEndTime.toISOString(),
            newStart: newStartTime.toISOString(),
            newEnd: newEndTime.toISOString(),
            dropTarget: dropData.timeSlot
        });

        // Update the event
        if (onEventUpdate) {
            try {
                await onEventUpdate(dragData.event.id, {
                    start: newStartTime,
                    end: newEndTime
                });
                console.log('✅ Event successfully moved via drag and drop');
            } catch (error) {
                console.error('❌ Failed to update event via drag and drop:', error);
            }
        }
    };
};

/**
 * Calculates if an event spans multiple time slots
 */
export const getEventTimeSlots = (event: CalendarEvent): { start: number; end: number; duration: number } => {
    const startHour = new Date(event.start).getHours();
    const endHour = new Date(event.end).getHours();
    const startMinutes = new Date(event.start).getMinutes();
    const endMinutes = new Date(event.end).getMinutes();

    // Calculate duration in hours (including fractional hours)
    const duration = (endHour + endMinutes / 60) - (startHour + startMinutes / 60);

    return {
        start: startHour,
        end: endHour,
        duration
    };
};

/**
 * Determines if a time slot should show visual feedback during drag over
 */
export const shouldShowDropFeedback = (
    draggedEvent: CalendarEvent,
    targetDate: Date,
    targetHour: number
): boolean => {
    // Don't show feedback if dropping on the same time slot
    const originalDate = new Date(draggedEvent.start);
    const originalHour = originalDate.getHours();

    const isSameDay = originalDate.toDateString() === targetDate.toDateString();
    const isSameHour = originalHour === targetHour;

    return !(isSameDay && isSameHour);
};
