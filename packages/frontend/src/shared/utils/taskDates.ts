/**
 * Task date display utilities — shared across task features.
 *
 * Dates are stored as UTC midnight ISO strings (Prisma DateTime).
 * All comparisons resolve "today" in the brand's IANA timezone so that a task
 * due "March 30" is never reported as overdue while it is still March 30 in the
 * studio's city — regardless of where the browser is running.
 *
 * Pass `timezone` from `useBrandTimezone()` wherever these functions are called.
 * Omitting it (or passing `undefined`) falls back to UTC, which is safe but
 * will drift by up to ±12 h relative to the studio's local date.
 */

/**
 * Integer day difference relative to today in `timezone`.
 * Negative = past, 0 = today, positive = future.
 * The due date's calendar day is always read from its UTC storage value.
 */
export function utcDiffDays(dateStr: string, timezone = 'UTC'): number {
    const due = new Date(dateStr);
    // Calendar date as stored (UTC midnight → the intended calendar date)
    const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
    // Today's calendar date in the brand's timezone (en-CA → stable YYYY-MM-DD)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const todayInTz = Date.UTC(ty, tm - 1, td);
    return (dueUTC - todayInTz) / 86400000;
}

/** True if a date is strictly in the past (not today) in `timezone`. Excludes completed tasks. */
export function isDateOverdue(dateStr: string | null, status?: string, timezone = 'UTC'): boolean {
    if (!dateStr || status === 'Completed') return false;
    return utcDiffDays(dateStr, timezone) < 0;
}

/** True if a date is today in `timezone`. */
export function isDateToday(dateStr: string | null, timezone = 'UTC'): boolean {
    if (!dateStr) return false;
    return utcDiffDays(dateStr, timezone) === 0;
}

/** Relative due-date display with overdue/today/tomorrow logic */
export function formatDueDate(
    dateStr: string | null,
    isCompleted = false,
    timezone = 'UTC',
): { text: string; color: string; urgent: boolean } {
    if (!dateStr) return { text: 'No date', color: '#676879', urgent: false };
    const diffDays = utcDiffDays(dateStr, timezone);
    const formatted = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: timezone });
    if (diffDays < 0) {
        if (isCompleted) return { text: formatted, color: '#676879', urgent: false };
        return { text: `Overdue · ${formatted}`, color: '#D83A52', urgent: true };
    }
    if (diffDays === 0) return { text: 'Today', color: isCompleted ? '#676879' : '#FDAB3D', urgent: !isCompleted };
    if (diffDays === 1) return { text: 'Tomorrow', color: '#FDAB3D', urgent: false };
    if (diffDays <= 7) return { text: formatted, color: '#579BFC', urgent: false };
    return { text: formatted, color: '#676879', urgent: false };
}

/** Bucket a due date into a human-readable group name */
export function getDateGroup(dateStr: string | null, timezone = 'UTC'): string {
    if (!dateStr) return 'No Due Date';
    const diffDays = utcDiffDays(dateStr, timezone);
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return 'This Week';
    if (diffDays <= 14) return 'Next Week';
    if (diffDays <= 30) return 'This Month';
    return 'Later';
}

/** Format an offset-days value for display (e.g. +3d, -1d) */
export function formatOffsetDays(days: number | null | undefined): string {
    if (days == null) return '—';
    return `${days > 0 ? '+' : ''}${days}d`;
}
