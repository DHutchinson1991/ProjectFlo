import {
    Assignment,
    AttachMoney,
    Phone,
    Description,
    CalendarToday,
    Gavel,
    CheckCircle,
    Email,
    EventAvailable,
    Send,
    PhotoLibrary,
    RequestQuote,
    Schedule,
    Handshake,
    Verified,
} from '@mui/icons-material';
import type { WorkflowPhase, NaCategory, PipelineTask } from './types';
import type { InquiryTask, Inquiry } from '@/lib/types';

// ─── Workflow phases (legacy — used as fallback) ─────────────────────

export const WORKFLOW_PHASES: WorkflowPhase[] = [
    {
        id: 'needs-assessment',
        name: 'Needs Assessment',
        icon: Assignment,
        color: '#3b82f6',
        description: 'Initial requirements gathering',
        tasks: ['Review Inquiry', 'Initial Contact', 'Assess Requirements'],
        sectionId: 'needs-assessment-section',
    },
    {
        id: 'estimates',
        name: 'Estimates',
        icon: AttachMoney,
        color: '#10b981',
        description: 'Financial estimation',
        tasks: ['Draft Estimate', 'Internal Review', 'Send Estimate'],
        sectionId: 'estimates-section',
    },
    {
        id: 'calls',
        name: 'Discovery Calls',
        icon: Phone,
        color: '#f59e0b',
        description: 'Client meetings and discovery',
        tasks: ['Schedule Call', 'Conduct Discovery Call', 'Log Meeting Notes'],
        sectionId: 'calls-section',
    },
    {
        id: 'proposals',
        name: 'Proposals',
        icon: Description,
        color: '#8b5cf6',
        description: 'Project proposal creation',
        tasks: ['Draft Proposal', 'Select Assets', 'Send Proposal'],
        sectionId: 'proposals-section',
    },
    {
        id: 'consultation',
        name: 'Consultation',
        icon: CalendarToday,
        color: '#ec4899',
        description: 'In-depth consultation',
        tasks: ['Prepare Agenda', 'Consultation Meeting', 'Post-Consultation Summary'],
        sectionId: 'consultation-section',
    },
    {
        id: 'quotes',
        name: 'Quotes',
        icon: AttachMoney,
        color: '#ef4444',
        description: 'Detailed quoting',
        tasks: ['Generate Quote', 'Review Terms', 'Send for Approval'],
        sectionId: 'quotes-section',
    },
    {
        id: 'contracts',
        name: 'Contracts',
        icon: Gavel,
        color: '#6366f1',
        description: 'Legal agreements',
        tasks: ['Draft Contract', 'Legal Check', 'Send for Signature'],
        sectionId: 'contracts-section',
    },
    {
        id: 'approval',
        name: 'Client Approval',
        icon: CheckCircle,
        color: '#14b8a6',
        description: 'Final sign-off',
        tasks: ['Verify Signature', 'Process Deposit', 'Project Kickoff'],
        sectionId: 'approval-section',
    },
];

// ─── Pipeline task icon + section mapping ────────────────────────────

const INQUIRY_COLOR = '#3b82f6';
const BOOKING_COLOR = '#8b5cf6';

// ─── Color temperature gradient (cool → warm → green) ────────────────
// Each dot gets a color that shifts along a temperature ramp
// based on its position in the full pipeline.
const TEMP_STOPS = [
    '#3b82f6', // cool blue (start)
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#a855f7', // violet
    '#c084fc', // light violet
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // amber
    '#22c55e', // green (booked!)
];

/** Interpolate between two hex colors. t ∈ [0, 1]. */
function lerpColor(a: string, b: string, t: number): string {
    const parse = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const c = (v1: number, v2: number) => Math.round(v1 + (v2 - v1) * t);
    return `#${c(r1, r2).toString(16).padStart(2, '0')}${c(g1, g2).toString(16).padStart(2, '0')}${c(b1, b2).toString(16).padStart(2, '0')}`;
}

/** Get the temperature-gradient color for a task at position `idx` out of `total`. */
export function getTempColor(idx: number, total: number): string {
    if (total <= 1) return TEMP_STOPS[0];
    const t = idx / (total - 1); // 0 → 1
    const segment = t * (TEMP_STOPS.length - 1);
    const lo = Math.floor(segment);
    const hi = Math.min(lo + 1, TEMP_STOPS.length - 1);
    return lerpColor(TEMP_STOPS[lo], TEMP_STOPS[hi], segment - lo);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconMap = Record<string, { icon: React.ComponentType<any>; sectionId: string }>;

const TASK_META: IconMap = {
    'Initial Inquiry Response':   { icon: Email,          sectionId: 'needs-assessment-section' },
    'Date Availability Check':    { icon: EventAvailable, sectionId: 'needs-assessment-section' },
    'Send Needs Assessment':      { icon: Send,           sectionId: 'needs-assessment-section' },
    'Review Needs Assessment':    { icon: Assignment,     sectionId: 'needs-assessment-section' },
    'Portfolio Presentation':     { icon: PhotoLibrary,   sectionId: 'needs-assessment-section' },
    'Estimate Preparation':       { icon: RequestQuote,   sectionId: 'estimates-section' },
    'Discovery Call Scheduling':  { icon: Schedule,       sectionId: 'calls-section' },
    'Discovery Call':             { icon: Phone,          sectionId: 'calls-section' },
    'Budget Alignment':           { icon: AttachMoney,    sectionId: 'estimates-section' },
    'Proposal Creation':          { icon: Description,    sectionId: 'proposals-section' },
    'Proposal Delivery':          { icon: Send,           sectionId: 'proposals-section' },
    'Consultation Scheduling':    { icon: Schedule,       sectionId: 'consultation-section' },
    'Consultation Meeting':       { icon: CalendarToday,  sectionId: 'consultation-section' },
    'Quote Generation':           { icon: RequestQuote,   sectionId: 'quotes-section' },
    'Contract Preparation':       { icon: Gavel,          sectionId: 'contracts-section' },
    'Contract Negotiation':       { icon: Handshake,      sectionId: 'contracts-section' },
    'Booking Confirmation':       { icon: Verified,       sectionId: 'approval-section' },
};

/** Convert raw task library entries into PipelineTask[] for the PhaseOverview. */
export function buildPipelineTasks(
    tasks: { id: number; name: string; phase: string; order_index: number; description?: string | null }[],
): PipelineTask[] {
    return tasks
        .filter(t => t.phase === 'Inquiry' || t.phase === 'Booking')
        .sort((a, b) => {
            const phaseOrder = a.phase === 'Inquiry' ? 0 : 1;
            const phaseOrderB = b.phase === 'Inquiry' ? 0 : 1;
            if (phaseOrder !== phaseOrderB) return phaseOrder - phaseOrderB;
            return a.order_index - b.order_index;
        })
        .map(t => {
            const meta = TASK_META[t.name] ?? { icon: Assignment, sectionId: 'needs-assessment-section' };
            return {
                id: t.id,
                name: t.name,
                phase: t.phase as 'Inquiry' | 'Booking',
                order_index: t.order_index,
                color: t.phase === 'Inquiry' ? INQUIRY_COLOR : BOOKING_COLOR,
                icon: meta.icon,
                sectionId: meta.sectionId,
                description: t.description ?? undefined,
            } as PipelineTask;
        });
}

/** Build PipelineTask[] from real per-inquiry task instances (with completion status). */
export function buildPipelineTasksFromInquiry(inquiryTasks: InquiryTask[]): PipelineTask[] {
    return inquiryTasks
        .filter(t => t.is_active && (t.phase === 'Inquiry' || t.phase === 'Booking'))
        .sort((a, b) => a.order_index - b.order_index)
        .map(t => {
            const meta = TASK_META[t.name] ?? { icon: Assignment, sectionId: 'needs-assessment-section' };
            return {
                id: t.task_library_id ?? t.id,
                inquiry_task_id: t.id,
                name: t.name,
                phase: t.phase as 'Inquiry' | 'Booking',
                order_index: t.order_index,
                color: t.phase === 'Inquiry' ? INQUIRY_COLOR : BOOKING_COLOR,
                icon: meta.icon,
                sectionId: meta.sectionId,
                description: t.description ?? undefined,
                status: t.status,
                estimated_hours: t.estimated_hours,
                due_date: t.due_date,
                completed_at: t.completed_at,
            };
        });
}

// ─── Auto-complete rules (data-driven tasks) ────────────────────────

export interface AutoCompleteRule {
    check: (inquiry: Inquiry & { activity_logs?: unknown[] }) => boolean;
    doneLabel: string;
    pendingLabel: string;
}

/** Tasks whose completion is determined by inquiry data — not manually toggleable. */
export const TASK_AUTO_COMPLETE: Record<string, AutoCompleteRule> = {
    'Estimate Preparation': {
        check: (inq) => (inq.estimates?.some(e => e.status === 'Sent' || e.status === 'Accepted') ?? false),
        doneLabel: 'Estimate sent',
        pendingLabel: 'Create an estimate',
    },
    'Budget Alignment': {
        check: (inq) => (inq.estimates?.length ?? 0) > 0,
        doneLabel: 'Budget reviewed',
        pendingLabel: 'Create an estimate',
    },
    'Proposal Creation': {
        check: (inq) => (inq.proposals?.length ?? 0) > 0,
        doneLabel: 'Proposal created',
        pendingLabel: 'Create a proposal',
    },
    'Proposal Delivery': {
        check: (inq) => (inq.proposals?.length ?? 0) > 0,
        doneLabel: 'Proposal delivered',
        pendingLabel: 'Create a proposal',
    },
    'Quote Generation': {
        check: (inq) => (inq.quotes?.length ?? 0) > 0,
        doneLabel: 'Quote generated',
        pendingLabel: 'Generate a quote',
    },
    'Contract Preparation': {
        check: (inq) => (inq.contracts?.length ?? 0) > 0,
        doneLabel: 'Contract prepared',
        pendingLabel: 'Prepare a contract',
    },
    'Contract Negotiation': {
        check: (inq) => (inq.contracts?.length ?? 0) > 0,
        doneLabel: 'Contract negotiated',
        pendingLabel: 'Prepare a contract',
    },
};

// ─── Needs assessment grouping categories ────────────────────────────

export const NA_CATEGORIES: NaCategory[] = [
    { label: 'Contact', keys: ['contact_first_name', 'contact_last_name', 'contact_email', 'contact_phone', 'contact_role', 'partner_name'] },
    { label: 'Event', keys: ['wedding_date', 'ceremony_location', 'venue_details', 'event_type', 'stakeholders', 'bridal_prep_location', 'groom_prep_location', 'reception_location'] },
    { label: 'Coverage', keys: ['coverage_hours', 'deliverables', 'add_ons', 'selected_package'] },
    { label: 'Budget', keys: ['budget_range', 'budget_flexible', 'priority_level'] },
    { label: 'Timeline', keys: ['decision_timeline', 'booking_date'] },
    { label: 'Communication', keys: ['preferred_contact_method', 'preferred_contact_time', 'lead_source'] },
    { label: 'Discovery Call', keys: ['discovery_call_method', 'discovery_call_date', 'discovery_call_time'] },
    { label: 'Notes', keys: ['notes', 'additional_notes', 'special_requests'] },
];
