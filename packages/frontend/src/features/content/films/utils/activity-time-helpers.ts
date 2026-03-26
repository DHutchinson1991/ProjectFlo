export interface ActivityRecord {
    id: number;
    package_id: number;
    package_event_day_id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    order_index: number;
}

export interface PackageEventDay {
    id: number;
    name: string;
    _joinId?: number;
}

export function parseTimeToMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

export function formatTimeDisplay(time: string | null | undefined): string {
    if (!time) return '';
    const mins = parseTimeToMinutes(time);
    if (mins === null) return time;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatDuration(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getActivityDuration(act: ActivityRecord): number {
    if (act.duration_minutes && act.duration_minutes > 0) return act.duration_minutes;
    if (act.start_time && act.end_time) {
        const s = parseTimeToMinutes(act.start_time);
        const e = parseTimeToMinutes(act.end_time);
        if (s !== null && e !== null && e > s) return e - s;
    }
    return 0;
}

export function sortByTime(activities: ActivityRecord[]): ActivityRecord[] {
    return [...activities].sort((a, b) => {
        const aMin = parseTimeToMinutes(a.start_time);
        const bMin = parseTimeToMinutes(b.start_time);
        if (aMin === null && bMin === null) return a.order_index - b.order_index;
        if (aMin === null) return 1;
        if (bMin === null) return -1;
        return aMin - bMin;
    });
}
