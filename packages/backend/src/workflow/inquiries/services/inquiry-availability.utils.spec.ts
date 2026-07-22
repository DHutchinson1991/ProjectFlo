import {
    combineDateAndTime,
    getEventDayTimeRange,
    isSameDay,
    timeRangesOverlap,
} from './inquiry-availability.utils';

describe('inquiry-availability.utils', () => {
    describe('combineDateAndTime', () => {
        it('combines a date with HH:MM time', () => {
            const date = new Date('2026-07-15T12:00:00.000Z');
            const result = combineDateAndTime(date, '14:30');

            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
            expect(result.getSeconds()).toBe(0);
        });

        it('defaults missing minutes to zero', () => {
            const date = new Date('2026-07-15T12:00:00.000Z');
            const result = combineDateAndTime(date, '09');

            expect(result.getHours()).toBe(9);
            expect(result.getMinutes()).toBe(0);
        });
    });

    describe('getEventDayTimeRange', () => {
        it('uses explicit start and end times', () => {
            const date = new Date('2026-07-15T00:00:00.000Z');
            const range = getEventDayTimeRange({
                date,
                start_time: '10:00',
                end_time: '18:00',
            });

            expect(range.start.getHours()).toBe(10);
            expect(range.end.getHours()).toBe(18);
            expect(range.end > range.start).toBe(true);
        });

        it('falls back to full day when end time is before start time', () => {
            const date = new Date('2026-07-15T00:00:00.000Z');
            const range = getEventDayTimeRange({
                date,
                start_time: '22:00',
                end_time: '02:00',
            });

            expect(range.start.getHours()).toBe(22);
            expect(range.end.getHours()).toBe(23);
            expect(range.end.getMinutes()).toBe(59);
        });

        it('defaults to midnight through end-of-day when times are null', () => {
            const date = new Date('2026-07-15T00:00:00.000Z');
            const range = getEventDayTimeRange({
                date,
                start_time: null,
                end_time: null,
            });

            expect(range.start.getHours()).toBe(0);
            expect(range.end.getHours()).toBe(23);
            expect(range.end.getMinutes()).toBe(59);
        });
    });

    describe('timeRangesOverlap', () => {
        it('detects overlapping ranges', () => {
            const left = {
                start: new Date('2026-07-15T10:00:00.000Z'),
                end: new Date('2026-07-15T14:00:00.000Z'),
            };
            const right = {
                start: new Date('2026-07-15T12:00:00.000Z'),
                end: new Date('2026-07-15T16:00:00.000Z'),
            };

            expect(timeRangesOverlap(left, right)).toBe(true);
        });

        it('returns false for adjacent non-overlapping ranges', () => {
            const left = {
                start: new Date('2026-07-15T10:00:00.000Z'),
                end: new Date('2026-07-15T12:00:00.000Z'),
            };
            const right = {
                start: new Date('2026-07-15T12:00:00.000Z'),
                end: new Date('2026-07-15T14:00:00.000Z'),
            };

            expect(timeRangesOverlap(left, right)).toBe(false);
        });

        it('returns false when one range is fully before the other', () => {
            const left = {
                start: new Date('2026-07-15T08:00:00.000Z'),
                end: new Date('2026-07-15T10:00:00.000Z'),
            };
            const right = {
                start: new Date('2026-07-15T14:00:00.000Z'),
                end: new Date('2026-07-15T18:00:00.000Z'),
            };

            expect(timeRangesOverlap(left, right)).toBe(false);
        });
    });

    describe('isSameDay', () => {
        it('compares calendar days in UTC', () => {
            const morning = new Date('2026-07-15T08:00:00.000Z');
            const evening = new Date('2026-07-15T20:00:00.000Z');
            const nextDay = new Date('2026-07-16T01:00:00.000Z');

            expect(isSameDay(morning, evening)).toBe(true);
            expect(isSameDay(morning, nextDay)).toBe(false);
        });
    });
});
