/**
 * Date/time utilities — parsing, formatting, arithmetic.
 */

/** Format "14:30" → "2:30pm". */
export function formatSlotLabel(time: string): string {
    if (!time || !time.includes(':')) return time;
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

/** Add durationMinutes to an ISO-ish datetime string, return local datetime string. */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/** Parse natural-language time preference ("morning" → "08:00") or HH:MM string. */
export const parsePreferredTime = (time?: string): string | null => {
    if (!time) return null;
    if (/^\d{1,2}:\d{2}$/.test(time)) return time.padStart(5, '0');
    const lower = time.toLowerCase();
    if (lower.includes('morning')) return '08:00';
    if (lower.includes('afternoon')) return '12:00';
    if (lower.includes('evening')) return '17:00';
    return null;
};

/** Relative time string ("2h ago", "3d ago", "just now"). */
export function timeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Format seconds → human-readable duration ("2m 30s", "1h 15m"). */
export function formatSectionDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return '0s';
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return remMinutes ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

/** Return colour tokens for a duration value (green ≥120s, amber ≥45s, muted otherwise). */
export function getDurationVisual(totalSeconds: number): { text: string; bg: string; border: string } {
    if (totalSeconds >= 120) {
        return { text: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.28)' };
    }
    if (totalSeconds >= 45) {
        return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)' };
    }
    return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.16)' };
}
