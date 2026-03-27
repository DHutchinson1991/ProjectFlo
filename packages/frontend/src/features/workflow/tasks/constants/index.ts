import { PHASE_CONFIG, PHASE_ORDER as SHARED_PHASE_ORDER } from '@/shared/ui/tasks';

export type GroupMode = 'project' | 'status' | 'person' | 'date' | 'phase';

export const GRID_COLS = '24px minmax(130px, 1.2fr) minmax(0, 2.5fr) 96px 160px 130px 80px';

/** Phase colors derived from shared config */
export const PHASE_COLORS: Record<string, string> = Object.fromEntries(
    Object.entries(PHASE_CONFIG).map(([k, v]) => [k, v.color])
);

/** Phase labels derived from shared config */
export const PHASE_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(PHASE_CONFIG).map(([k, v]) => [k, v.label])
);

export const PHASE_ORDER = SHARED_PHASE_ORDER;

export const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; order: number }> = {
    To_Do:          { color: '#323338', bg: '#C4C4C4', label: 'To Do',    order: 0 },
    Ready_to_Start: { color: '#fff',    bg: '#FDAB3D', label: 'Ready',    order: 1 },
    In_Progress:    { color: '#fff',    bg: '#579BFC', label: 'Working',  order: 2 },
    Completed:      { color: '#fff',    bg: '#00C875', label: 'Done',     order: 3 },
    Archived:       { color: '#fff',    bg: '#999999', label: 'Archived', order: 4 },
};

export const STATUS_ORDER = ['To_Do', 'Ready_to_Start', 'In_Progress', 'Completed'];

export const DATE_GROUP_ORDER = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Next Week', 'This Month', 'Later', 'No Due Date'];

export const DATE_GROUP_COLORS: Record<string, string> = {
    Overdue: '#D83A52', Today: '#FDAB3D', Tomorrow: '#FDAB3D',
    'This Week': '#579BFC', 'Next Week': '#A25DDC', 'This Month': '#00C875',
    Later: '#676879', 'No Due Date': '#676879',
};
