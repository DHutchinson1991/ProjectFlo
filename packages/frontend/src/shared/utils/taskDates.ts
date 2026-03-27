/**
 * Task date display utilities — shared across task features.
 */

/** Relative due-date display with overdue/today/tomorrow logic */
export function formatDueDate(
    dateStr: string | null,
    isCompleted = false,
): { text: string; color: string; urgent: boolean } {
    if (!dateStr) return { text: 'No date', color: '#676879', urgent: false };
    const due = new Date(dateStr);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
export function getDateGroup(dateStr: string | null): string {
    if (!dateStr) return 'No Due Date';
    const due = new Date(dateStr);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
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
