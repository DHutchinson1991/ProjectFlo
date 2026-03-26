import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { filterEventsByDate } from '@/features/workflow/calendar/utils/calendar-event-helpers';

export interface WeekDayEventLayout {
    top: number;
    height: number;
    isAllDay: boolean;
    startMinutes?: number;
    endMinutes?: number;
    widthPercent: number;
    leftOffsetPercent: number;
    isSpanningEvent?: boolean;
    spanStartDay?: boolean;
    spanEndDay?: boolean;
}

export type WeekEventWithLayout = CalendarEvent & WeekDayEventLayout;

export interface WeekDayEvents {
    day: Date;
    events: WeekEventWithLayout[];
}

/** Calculate positioned events for each day of the week. */
export function calculateWeekEventPositions(
    weekDays: Date[],
    events: CalendarEvent[],
): WeekDayEvents[] {
    return weekDays.map(day => {
        const dayEvents = filterEventsByDate(events, day);

        const eventsWithBasicPositioning = dayEvents.map(event => {
            if (event.allDay) {
                return { ...event, top: 0, height: 60, isAllDay: true as const,
                    startMinutes: 0, endMinutes: 0, widthPercent: 100, leftOffsetPercent: 0 };
            }

            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
            const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
            const currentDayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());

            const isSpanningEvent = eventStartDate.getTime() !== eventEndDate.getTime();
            const spanStartDay = currentDayDate.getTime() === eventStartDate.getTime();
            const spanEndDay = currentDayDate.getTime() === eventEndDate.getTime();

            let dayStartMinutes: number;
            let dayEndMinutes: number;

            if (isSpanningEvent) {
                if (spanStartDay) {
                    dayStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                    dayEndMinutes = 24 * 60;
                } else if (spanEndDay) {
                    dayStartMinutes = 0;
                    dayEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
                } else {
                    dayStartMinutes = 0;
                    dayEndMinutes = 24 * 60;
                }
            } else {
                dayStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                dayEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
            }

            const durationMinutes = dayEndMinutes - dayStartMinutes;
            const pixelsPerMinute = 80 / 60;
            const borderOffset = Math.floor(dayStartMinutes / 60);
            const startHour = Math.floor(dayStartMinutes / 60);
            const endHour = Math.floor(dayEndMinutes / 60);
            const bordersWithinEvent = Math.max(0, endHour - startHour);

            return {
                ...event,
                top: dayStartMinutes * pixelsPerMinute + borderOffset,
                height: Math.max(durationMinutes * pixelsPerMinute + bordersWithinEvent, 15),
                isAllDay: false as const,
                startMinutes: dayStartMinutes,
                endMinutes: dayEndMinutes,
                isSpanningEvent, spanStartDay, spanEndDay,
                widthPercent: 100, leftOffsetPercent: 0,
            };
        });

        // Handle overlaps for non-allDay events
        const nonAllDay = eventsWithBasicPositioning.filter(e => !e.allDay);
        const allDay = eventsWithBasicPositioning.filter(e => e.allDay);

        const groups: (typeof nonAllDay)[] = [];
        for (const event of nonAllDay) {
            let added = false;
            for (const group of groups) {
                if (group.some(g => event.startMinutes! < g.endMinutes! && event.endMinutes! > g.startMinutes!)) {
                    group.push(event);
                    added = true;
                    break;
                }
            }
            if (!added) groups.push([event]);
        }

        const finalEvents: WeekEventWithLayout[] = [];
        for (const group of groups) {
            if (group.length === 1) {
                finalEvents.push({ ...group[0], widthPercent: 100, leftOffsetPercent: 0 });
            } else {
                const w = 100 / group.length;
                group.forEach((event, i) => {
                    finalEvents.push({ ...event, widthPercent: w, leftOffsetPercent: i * w });
                });
            }
        }
        allDay.forEach(e => finalEvents.push({ ...e, widthPercent: 100, leftOffsetPercent: 0 }));

        return { day, events: finalEvents };
    });
}
