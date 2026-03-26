import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';

// Extended event type with positioning properties for WeekView
export type ExtendedWeekEvent = CalendarEvent & {
    top: number;
    height: number;
    leftOffsetPercent?: number;
    widthPercent?: number;
};

/**
 * Calculate positioning for events in WeekView
 * WeekView uses different scaling than DayView due to space constraints
 */
export const calculateWeekEventPositioning = (events: CalendarEvent[]): ExtendedWeekEvent[] => {
    return events.map(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Calculate position in minutes from start of day
        const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
        const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
        const durationMinutes = endMinutes - startMinutes;

        // WeekView specific scaling: 80px per hour to match the grid
        const pixelsPerMinute = 80 / 60; // 80px per hour / 60 minutes

        // Account for 1px border-bottom on each hour row (except the last)
        // Each complete hour before this event adds 1px to the offset
        const borderOffset = eventStart.getHours(); // 1px per completed hour

        // For height, also account for borders within the event's span
        // Count borders that fall within the event duration
        const startHour = eventStart.getHours();
        const endHour = eventEnd.getHours();
        const bordersWithinEvent = Math.max(0, endHour - startHour); // Borders between start and end hour

        return {
            ...event,
            top: startMinutes * pixelsPerMinute + borderOffset,
            height: Math.max(durationMinutes * pixelsPerMinute + bordersWithinEvent, 15), // Minimum 15px height
        };
    });
};

/**
 * Handle overlapping events in WeekView
 * Groups overlapping events and calculates width/position percentages
 */
export const handleWeekEventOverlaps = (eventsWithPositions: ExtendedWeekEvent[]): ExtendedWeekEvent[] => {
    // Group overlapping events
    const eventGroups: ExtendedWeekEvent[][] = [];
    const nonAllDayEvents = eventsWithPositions.filter(event => !event.allDay);

    // Simple overlap detection
    nonAllDayEvents.forEach(event => {
        let addedToGroup = false;

        for (const group of eventGroups) {
            const overlapsWithGroup = group.some(groupEvent => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                const groupStart = new Date(groupEvent.start);
                const groupEnd = new Date(groupEvent.end);

                return (
                    (eventStart < groupEnd && eventEnd > groupStart) ||
                    (groupStart < eventEnd && groupEnd > eventStart)
                );
            });

            if (overlapsWithGroup) {
                group.push(event);
                addedToGroup = true;
                break;
            }
        }

        if (!addedToGroup) {
            eventGroups.push([event]);
        }
    });

    // Calculate positions for overlapping events
    const eventsWithLayout: ExtendedWeekEvent[] = [];

    eventGroups.forEach(group => {
        group.forEach((event, index) => {
            const groupSize = group.length;
            eventsWithLayout.push({
                ...event,
                widthPercent: groupSize > 1 ? 100 / groupSize : 100,
                leftOffsetPercent: groupSize > 1 ? (index * 100) / groupSize : 0
            });
        });
    });

    // Include all-day events without modification
    const allDayEvents = eventsWithPositions.filter(event => event.allDay);

    return [...eventsWithLayout, ...allDayEvents];
};
