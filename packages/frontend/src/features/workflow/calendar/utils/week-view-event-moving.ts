import { DragEndEvent } from '@dnd-kit/core';
import { DragData, TimeSlotDropData } from '../types/drag-drop.types';

export interface WeekViewDragDropConfig {
    onEventUpdate?: (eventId: string, updateData: { start: Date; end: Date }) => Promise<void>;
}

/**
 * Calculates new event times based on drag and drop operation with enhanced snapping
 */
export const calculateDroppedEventTimes = (
    dragData: DragData,
    dropData: TimeSlotDropData
): { start: Date; end: Date } => {
    // Calculate the duration of the original event
    const originalDuration = dragData.originalEndTime.getTime() - dragData.originalStartTime.getTime();

    // Create new start time based on drop target
    const newStartTime = new Date(dropData.date);

    // Handle decimal time (supports 15-minute intervals)
    const hours = Math.floor(dropData.time);
    const minutes = Math.round((dropData.time - hours) * 60);

    newStartTime.setHours(hours, minutes, 0, 0);

    // Snap to 15-minute intervals
    const snappedStartTime = snapToTimeInterval(newStartTime, 15);

    // Create new end time preserving the original duration
    const newEndTime = new Date(snappedStartTime.getTime() + originalDuration);

    return { start: snappedStartTime, end: newEndTime };
};

/**
 * Calculates new event times based on transform values for real-time dragging
 */
export const calculateDraggedEventTimes = (
    originalStart: Date,
    originalEnd: Date,
    transform: { x: number; y: number },
    dayIndex: number,
    weekDays: Date[]
): { start: Date; end: Date } => {
    // Get actual calendar container width instead of window width
    const calendarContainer = document.querySelector('[data-calendar-container]');
    const containerWidth = calendarContainer ? calendarContainer.clientWidth : 800; // fallback

    // Calculate day column width more accurately
    const availableWidth = containerWidth - 100; // subtract hour label width
    const dayColumnWidth = availableWidth / 7;
    const pixelsPerMinute = 80 / 60; // 80px per hour

    // Add tolerance for horizontal movement - only move to new day if dragged significantly
    const horizontalTolerance = dayColumnWidth * 0.3; // 30% of day width tolerance
    let dayOffset = 0;

    if (Math.abs(transform.x) > horizontalTolerance) {
        // Only switch days if moved beyond tolerance zone
        dayOffset = Math.round((transform.x - Math.sign(transform.x) * horizontalTolerance) / dayColumnWidth);
    }

    const newDayIndex = Math.max(0, Math.min(6, dayIndex + dayOffset));
    const targetDay = weekDays[newDayIndex];

    // Add tolerance for vertical movement - only snap to 15-minute intervals after moving enough
    const verticalTolerance = 10; // 10 pixels tolerance
    let timeOffsetMinutes = 0;

    if (Math.abs(transform.y) > verticalTolerance) {
        timeOffsetMinutes = Math.round((transform.y - Math.sign(transform.y) * verticalTolerance) / pixelsPerMinute / 15) * 15;
    }

    // Create new start time
    const newStart = new Date(targetDay);
    const originalHours = originalStart.getHours();
    const originalMinutes = originalStart.getMinutes();

    // Calculate new time with offset
    let newHours = originalHours;
    let newMinutes = originalMinutes + timeOffsetMinutes;

    // Handle minute overflow/underflow
    while (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
    }
    while (newMinutes < 0) {
        newMinutes += 60;
        newHours -= 1;
    }

    // Clamp to valid day bounds (0-23:45)
    if (newHours < 0) {
        newHours = 0;
        newMinutes = 0;
    } else if (newHours > 23) {
        newHours = 23;
        newMinutes = 45;
    } else if (newHours === 23 && newMinutes > 45) {
        newMinutes = 45;
    }

    newStart.setHours(newHours, newMinutes, 0, 0);

    // Calculate new end time preserving duration
    const duration = originalEnd.getTime() - originalStart.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    return { start: newStart, end: newEnd };
};
/**
 * Checks if an event has actually moved to a different time
 */
export const hasEventMoved = (
    originalStart: Date,
    newStart: Date
): boolean => {
    return originalStart.getTime() !== newStart.getTime();
};

/**
 * Snaps a time to the nearest interval
 */
export const snapToTimeInterval = (
    date: Date,
    intervalMinutes: number = 15
): Date => {
    const minutes = date.getMinutes();
    const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;

    const snappedDate = new Date(date);
    snappedDate.setMinutes(snappedMinutes, 0, 0);

    return snappedDate;
};

/**
 * Creates a drag and drop handler specifically for week view with enhanced snapping
 */
export const createWeekViewDragDropHandler = ({ onEventUpdate }: WeekViewDragDropConfig) => {
    return async (event: DragEndEvent) => {
        const { active, over, delta } = event;

        if (!onEventUpdate) return;

        // Extract drag data from the active event
        const dragData = active.data.current as DragData;

        if (!dragData || !dragData.event) {
            console.warn('Invalid drag data');
            return;
        }

        // If dropped over a specific time slot, use that
        if (over) {
            const dropData = over.data.current as TimeSlotDropData;
            if (dropData && dropData.type === 'timeSlot') {
                const { start: newStartTime, end: newEndTime } = calculateDroppedEventTimes(dragData, dropData);

                if (!hasEventMoved(dragData.originalStartTime, newStartTime)) {
                    console.log('Event dropped on same time slot, no update needed');
                    return;
                }

                try {
                    await onEventUpdate(dragData.event.id, {
                        start: newStartTime,
                        end: newEndTime
                    });
                    console.log('✅ Week view drag and drop completed successfully');
                } catch (error) {
                    console.error('❌ Week view drag and drop failed:', error);
                    throw error;
                }
                return;
            }
        }

        // If no specific drop target, calculate based on transform delta
        if (delta && (Math.abs(delta.x) > 5 || Math.abs(delta.y) > 5)) {
            // Create a mock week days array - in real implementation this should come from props
            const today = new Date();
            const weekStart = new Date(today);
            const day = weekStart.getDay();
            const mondayBasedDay = day === 0 ? 7 : day;
            const diff = weekStart.getDate() - (mondayBasedDay - 1);
            weekStart.setDate(diff);

            const weekDays = Array.from({ length: 7 }, (_, i) => {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                return day;
            });

            // Try to determine current day index from the original date
            const originalDay = new Date(dragData.originalStartTime);
            originalDay.setHours(0, 0, 0, 0);
            let dayIndex = 0;
            for (let i = 0; i < weekDays.length; i++) {
                const weekDay = new Date(weekDays[i]);
                weekDay.setHours(0, 0, 0, 0);
                if (weekDay.getTime() === originalDay.getTime()) {
                    dayIndex = i;
                    break;
                }
            }

            const { start: newStartTime, end: newEndTime } = calculateDraggedEventTimes(
                dragData.originalStartTime,
                dragData.originalEndTime,
                delta,
                dayIndex,
                weekDays
            );

            if (!hasEventMoved(dragData.originalStartTime, newStartTime)) {
                console.log('Event not moved enough, no update needed');
                return;
            }

            try {
                await onEventUpdate(dragData.event.id, {
                    start: newStartTime,
                    end: newEndTime
                });
                console.log('✅ Week view drag completed successfully via transform');
            } catch (error) {
                console.error('❌ Week view drag failed:', error);
                throw error;
            }
        }
    };
};

/**
 * Calculates pixel positions for event resize operations
 */
export const calculateResizePosition = (
    deltaY: number,
    pixelsPerHour: number = 80,
    snapToMinutes: number = 15
): number => {
    const pixelsPerMinute = pixelsPerHour / 60;
    return Math.round(deltaY / pixelsPerMinute / snapToMinutes) * snapToMinutes;
};

/**
 * Validates event duration during resize operations
 */
export const validateEventDuration = (
    newStart: Date,
    newEnd: Date,
    minDurationMinutes: number = 15
): { start: Date; end: Date } => {
    const validatedStart = new Date(newStart);
    let validatedEnd = new Date(newEnd);

    const durationMs = validatedEnd.getTime() - validatedStart.getTime();
    const minDurationMs = minDurationMinutes * 60 * 1000;

    if (durationMs < minDurationMs) {
        // If duration is too short, extend the end time
        validatedEnd = new Date(validatedStart.getTime() + minDurationMs);
    }

    return { start: validatedStart, end: validatedEnd };
};
