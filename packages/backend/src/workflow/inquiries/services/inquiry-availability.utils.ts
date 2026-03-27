/**
 * Shared time-range utilities for inquiry availability checks.
 * Pure functions — no Injectable, no side effects.
 */

export type TimeRange = { start: Date; end: Date };

export function getEventDayTimeRange(
    eventDay: { date: Date; start_time: string | null; end_time: string | null },
): TimeRange {
    const start = combineDateAndTime(eventDay.date, eventDay.start_time ?? '00:00');
    const end = combineDateAndTime(eventDay.date, eventDay.end_time ?? '23:59');
    return { start, end: end > start ? end : combineDateAndTime(eventDay.date, '23:59') };
}

export function combineDateAndTime(date: Date, time: string): Date {
    const [hours = '0', minutes = '0'] = time.split(':');
    const result = new Date(date);
    result.setHours(Number(hours), Number(minutes), 0, 0);
    return result;
}

export function timeRangesOverlap(left: TimeRange, right: TimeRange): boolean {
    return left.start < right.end && left.end > right.start;
}

export function isSameDay(left: Date, right: Date): boolean {
    return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}
