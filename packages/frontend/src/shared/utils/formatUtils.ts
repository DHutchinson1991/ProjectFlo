// Re-export canonical currency formatting from @projectflo/shared
export { getCurrencySymbol, formatCurrency } from '@projectflo/shared';

/**
 * Formats a duration in seconds into a human-readable mm:ss or h:mm:ss string.
 */
export function formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(seconds)}`
        : `${minutes}:${pad(seconds)}`;
}

/** Alias for formatTime — kept for backward compatibility. */
export const formatDuration = formatTime;
