import {
    combineDateAndTime,
    getEventDayTimeRange,
    isSameDay,
    timeRangesOverlap,
} from './inquiry-availability.utils';

describe('inquiry-availability.utils', () => {
    describe('combineDateAndTime', () => {
        it('combines date with HH:MM time', () => {
            const date = new Date('2026-07-15T12:00:00.000Z');
            const result = combineDateAndTime(date, '14:30');
            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
        });
    });

    describe('timeRangesOverlap', () => {
        it('returns true when ranges overlap', () => {
            const left = { start: new Date('2026-01-01T10:00:00'), end: new Date('2026-01-01T12:00:00') };
            const right = { start: new Date('2026-01-01T11:00:00'), end: new Date('2026-01-01T13:00:00') };
            expect(timeRangesOverlap(left, right)).toBe(true);
        });

        it('returns false when ranges are adjacent but not overlapping', () => {
            const left = { start: new Date('2026-01-01T10:00:00'), end: new Date('2026-01-01T11:00:00') };
            const right = { start: new Date('2026-01-01T11:00:00'), end: new Date('2026-01-01T12:00:00') };
            expect(timeRangesOverlap(left, right)).toBe(false);
        });
    });

    describe('isSameDay', () => {
        it('compares calendar days in UTC', () => {
            expect(isSameDay(new Date('2026-03-01T08:00:00Z'), new Date('2026-03-01T22:00:00Z'))).toBe(true);
            expect(isSameDay(new Date('2026-03-01T23:00:00Z'), new Date('2026-03-02T01:00:00Z'))).toBe(false);
        });
    });

    describe('getEventDayTimeRange', () => {
        it('uses start/end times when provided', () => {
            const date = new Date('2026-06-01');
            const range = getEventDayTimeRange({ date, start_time: '09:00', end_time: '17:00' });
            expect(range.start.getHours()).toBe(9);
            expect(range.end.getHours()).toBe(17);
            expect(range.end > range.start).toBe(true);
        });

        it('falls back to full day when end is before start', () => {
            const date = new Date('2026-06-01');
            const range = getEventDayTimeRange({ date, start_time: '18:00', end_time: '08:00' });
            expect(range.end.getHours()).toBe(23);
            expect(range.end.getMinutes()).toBe(59);
        });
    });
});
