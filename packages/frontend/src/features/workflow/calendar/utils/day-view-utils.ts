import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { filterTasksByDate, filterEventsByDate } from '@/features/workflow/calendar/utils/calendar-event-helpers';

/** Format 24-hour number to 12-hour AM/PM display. */
export function formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
}

export interface EventWithPosition {
    top: number;
    height: number;
    isAllDay: boolean;
    startMinutes?: number;
    endMinutes?: number;
}

export type EventWithLayout = CalendarEvent & EventWithPosition & {
    widthPercent: number;
    leftPercent: number;
};

/** Calculate pixel positions for events in day view. */
export function calculateEventPositions(events: CalendarEvent[]) {
    const sorted = [...events].sort((a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return sorted.map(event => {
        if (event.allDay) {
            return { ...event, top: 0, height: 60, isAllDay: true as const, startMinutes: 0, endMinutes: 0 };
        }

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
        const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
        const durationMinutes = endMinutes - startMinutes;
        const pixelsPerMinute = 80 / 60;

        return {
            ...event,
            top: startMinutes * pixelsPerMinute,
            height: Math.max(durationMinutes * pixelsPerMinute, 20),
            isAllDay: false as const,
            startMinutes,
            endMinutes,
        };
    });
}

/** Group overlapping non-all-day events for side-by-side layout. */
export function groupOverlappingEvents<T extends CalendarEvent>(events: T[]): T[][] {
    const nonAllDay = events.filter(e => !e.allDay);
    const groups: T[][] = [];

    for (const event of nonAllDay) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        let added = false;

        for (const group of groups) {
            const overlaps = group.some(g => {
                const gStart = new Date(g.start);
                const gEnd = new Date(g.end);
                return eventStart < gEnd && eventEnd > gStart;
            });
            if (overlaps) {
                group.push(event);
                added = true;
                break;
            }
        }
        if (!added) groups.push([event]);
    }

    return groups;
}

type PositionedEvent = ReturnType<typeof calculateEventPositions>[number];

/** Assign width/left percentages based on overlap groups. */
export function applyOverlapLayout(
    positioned: PositionedEvent[],
    groups: PositionedEvent[][]
): EventWithLayout[] {
    return positioned.map(event => {
        if (event.isAllDay) return { ...event, widthPercent: 100, leftPercent: 0 };

        const group = groups.find(g => g.some(e => e.id === event.id));
        if (!group || group.length === 1) return { ...event, widthPercent: 100, leftPercent: 0 };

        const idx = group.findIndex(e => e.id === event.id);
        const total = group.length;
        return {
            ...event,
            widthPercent: 100 / total,
            leftPercent: (idx / total) * 100,
        };
    });
}

/** Get day events and tasks from full arrays. */
export function getDayData(
    events: CalendarEvent[],
    tasks: CalendarTask[],
    date: Date
) {
    const dayEvents = filterEventsByDate(events, date);
    const dayTasks = filterTasksByDate(tasks, date);
    const positions = calculateEventPositions(dayEvents);
    const groups = groupOverlappingEvents(positions);
    const layout = applyOverlapLayout(positions, groups);
    return { dayEvents, dayTasks, eventsWithLayout: layout };
}
