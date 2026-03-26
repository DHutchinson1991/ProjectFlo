export type GroupMode = 'project' | 'status' | 'person' | 'date' | 'phase';

export const GRID_COLS = '24px minmax(130px, 1.2fr) minmax(0, 2.5fr) 96px 160px 130px 80px';

export const PHASE_COLORS: Record<string, string> = {
    Lead: '#FDAB3D', Inquiry: '#00C875', Booking: '#0086C0',
    Creative_Development: '#A25DDC', Pre_Production: '#FDAB3D',
    Production: '#FF158A', Post_Production: '#579BFC', Delivery: '#00C875',
};

export const PHASE_LABELS: Record<string, string> = {
    Lead: 'Lead', Inquiry: 'Inquiry', Booking: 'Booking',
    Creative_Development: 'Creative Development', Pre_Production: 'Pre-Production',
    Production: 'Production', Post_Production: 'Post-Production', Delivery: 'Delivery',
};

export const PHASE_ORDER = [
    'Lead', 'Inquiry', 'Booking', 'Creative_Development',
    'Pre_Production', 'Production', 'Post_Production', 'Delivery',
];

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
