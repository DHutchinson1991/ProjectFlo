/**
 * Shared phase configuration — canonical source for phase colors, labels, icons, and order.
 * Used by both catalog/task-library and workflow/tasks.
 */
import {
    TrendingUp as TrendingUpIcon,
    Search as SearchIcon,
    Check as CheckIcon,
    Edit as EditIcon,
    Schedule as ScheduleIcon,
    Assignment as TaskIcon,
    Timer as TimerIcon,
} from '@mui/icons-material';

export interface PhaseConfig {
    label: string;
    /** Primary solid color for text, borders, badges */
    color: string;
    /** MUI icon component */
    icon: typeof TrendingUpIcon;
}

export const PHASE_CONFIG: Record<string, PhaseConfig> = {
    Lead:                   { label: 'Lead',                  color: '#FDAB3D', icon: TrendingUpIcon },
    Inquiry:                { label: 'Inquiry',               color: '#00C875', icon: SearchIcon },
    Booking:                { label: 'Booking',               color: '#0086C0', icon: CheckIcon },
    Creative_Development:   { label: 'Creative Development',  color: '#A25DDC', icon: EditIcon },
    Pre_Production:         { label: 'Pre-Production',        color: '#FDAB3D', icon: ScheduleIcon },
    Production:             { label: 'Production',            color: '#FF158A', icon: TaskIcon },
    Post_Production:        { label: 'Post-Production',       color: '#579BFC', icon: TimerIcon },
    Delivery:               { label: 'Delivery',              color: '#00C875', icon: CheckIcon },
};

export const PHASE_ORDER = [
    'Lead', 'Inquiry', 'Booking', 'Creative_Development',
    'Pre_Production', 'Production', 'Post_Production', 'Delivery',
];

/** Safely access phase config with fallback */
export function getPhaseConfig(phase: string): PhaseConfig {
    return PHASE_CONFIG[phase] ?? { label: phase, color: '#676879', icon: TaskIcon };
}

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
