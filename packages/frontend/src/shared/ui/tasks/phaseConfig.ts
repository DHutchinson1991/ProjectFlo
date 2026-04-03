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

// ─── Phase descriptions ────────────────────────────────────────────────────

/** Studio-facing phase descriptions — comprehensive, operational detail */
export const PHASE_STUDIO_DESCRIPTIONS: Record<string, string> = {
    Lead:                 'Initial interest and lead capture. Qualify prospects, gather contact details, and assess fit before moving to inquiry.',
    Inquiry:              'Active discovery and needs assessment. Run questionnaires, consultations, and scope conversations to understand the project requirements.',
    Booking:              'Contract signing, payment collection, and onboarding. Finalise the package, send the proposal, and secure the booking.',
    Creative_Development: 'Concept planning, mood boards, style guides, creative briefs, and shot lists. Align creative vision with the client before production begins.',
    Pre_Production:       'Scheduling, crew assignment, equipment booking, location scouting, and logistics preparation. Everything required before cameras roll.',
    Production:           'On-site filming, live event coverage, and all day-of capture activities. Manage crew, schedule, and deliverables in real-time.',
    Post_Production:      'Editing, color grading, sound design, visual effects, and assembly of final deliverables. Iterative review and revision process.',
    Delivery:             'Final review, client revisions, export, and handoff of finished films and assets. Archive project and close out.',
};

/** Customer-facing phase descriptions — friendly, client-visible language */
export const PHASE_CUSTOMER_DESCRIPTIONS: Record<string, string> = {
    Creative_Development: 'Concept planning, mood boards, and creative vision for your film.',
    Pre_Production:       'Scheduling, shot planning, and logistics preparation.',
    Production:           'On-site filming and live event coverage.',
    Post_Production:      'Editing, color grading, sound design, and visual effects.',
    Delivery:             'Final review, revisions, and delivery of your finished films.',
};
