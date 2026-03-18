import {
    Assignment,
    AttachMoney,
    Phone,
    Description,
    Gavel,
    CheckCircle,
    Email,
    EventAvailable,
    Send,
    RequestQuote,
    Schedule,
    Handshake,
    Verified,
} from '@mui/icons-material';
import type { WorkflowPhase, NaCategory, PipelineTask } from './types';
import type { InquiryTask, Inquiry } from '@/lib/types';

// ─── Workflow phases ─────────────────────────────────────────────────

export const WORKFLOW_PHASES: WorkflowPhase[] = [
    {
        id: 'inquiry',
        name: 'Inquiry',
        icon: Assignment,
        color: '#3b82f6',
        description: 'Intake, qualify and estimate',
        tasks: ['Inquiry Received', 'Review Inquiry', 'Qualify & Respond', 'Estimate Preparation', 'Review Estimate'],
        sectionId: 'inquiry-section',
    },
    {
        id: 'discovery',
        name: 'Discovery',
        icon: Phone,
        color: '#f59e0b',
        description: 'Discovery call with the client',
        tasks: ['Discovery Call Scheduling', 'Discovery Call'],
        sectionId: 'discovery-section',
    },
    {
        id: 'proposal',
        name: 'Proposal',
        icon: Description,
        color: '#8b5cf6',
        description: 'Quote, contract and proposal',
        tasks: ['Generate Quote', 'Prepare Contract', 'Create & Review Proposal', 'Send Proposal', 'Contract Sent'],
        sectionId: 'proposal-section',
    },
    {
        id: 'booking',
        name: 'Booking',
        icon: Handshake,
        color: '#14b8a6',
        description: 'Sign, invoice and confirm',
        tasks: ['Contract Signed', 'Raise Deposit Invoice', 'Block Wedding Date', 'Confirm Booking', 'Send Welcome Pack'],
        sectionId: 'booking-section',
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
    // Inquiry stage
    'Inquiry Received':          { icon: CheckCircle,    sectionId: 'inquiry-section' },
    'Review Inquiry':            { icon: Assignment,     sectionId: 'inquiry-section' },
    'Qualify & Respond':         { icon: Email,          sectionId: 'inquiry-section' },
    'Estimate Preparation':      { icon: RequestQuote,   sectionId: 'inquiry-section' },
    'Review Estimate':           { icon: RequestQuote,   sectionId: 'inquiry-section' },
    // Discovery stage
    'Discovery Call Scheduling': { icon: Schedule,       sectionId: 'discovery-section' },
    'Discovery Call':            { icon: Phone,          sectionId: 'discovery-section' },
    // Proposal stage
    'Generate Quote':            { icon: RequestQuote,   sectionId: 'proposal-section' },
    'Prepare Contract':          { icon: Gavel,          sectionId: 'proposal-section' },
    'Create & Review Proposal':  { icon: Description,    sectionId: 'proposal-section' },
    'Send Proposal':             { icon: Send,           sectionId: 'proposal-section' },
    'Contract Sent':             { icon: Send,           sectionId: 'proposal-section' },
    // Booking stage
    'Contract Signed':           { icon: Verified,       sectionId: 'booking-section' },
    'Raise Deposit Invoice':     { icon: AttachMoney,    sectionId: 'booking-section' },
    'Block Wedding Date':        { icon: EventAvailable, sectionId: 'booking-section' },
    'Confirm Booking':           { icon: CheckCircle,    sectionId: 'booking-section' },
    'Send Welcome Pack':         { icon: Email,          sectionId: 'booking-section' },
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

/** Build PipelineTask[] from real per-inquiry task instances (with completion status).
 * Uses parent/child hierarchy: stage tasks define sections, children are the dots.
 */
export function buildPipelineTasksFromInquiry(inquiryTasks: InquiryTask[]): PipelineTask[] {
    // Separate stage parents from child tasks
    const stageTasks = inquiryTasks.filter(t => t.is_stage && t.is_active);
    const childTasks = inquiryTasks.filter(t => !t.is_stage && t.is_active && (t.phase === 'Inquiry' || t.phase === 'Booking'));

    // Build a sectionId from stage name for each child via its parent
    const stageMap = new Map<number, { name: string; color: string }>();
    for (const stage of stageTasks) {
        const sectionId = stage.name.toLowerCase().replace(/\s+/g, '-') + '-section';
        stageMap.set(stage.id, { name: sectionId, color: stage.stage_color || (stage.phase === 'Inquiry' ? INQUIRY_COLOR : BOOKING_COLOR) });
    }

    return childTasks
        .sort((a, b) => a.order_index - b.order_index)
        .map(t => {
            // Look up parent stage for section mapping
            const parentInfo = t.parent_inquiry_task_id ? stageMap.get(t.parent_inquiry_task_id) : null;
            const sectionId = parentInfo?.name ?? (TASK_META[t.name]?.sectionId ?? 'needs-assessment-section');
            const meta = TASK_META[t.name] ?? { icon: Assignment, sectionId };
            return {
                id: t.task_library_id ?? t.id,
                inquiry_task_id: t.id,
                name: t.name,
                phase: t.phase as 'Inquiry' | 'Booking',
                order_index: t.order_index,
                color: t.phase === 'Inquiry' ? INQUIRY_COLOR : BOOKING_COLOR,
                icon: meta.icon,
                sectionId,
                description: t.description ?? undefined,
                status: t.status,
                estimated_hours: t.estimated_hours,
                due_date: t.due_date,
                completed_at: t.completed_at,
                // Carry parent info for PhaseOverview grouping
                parentStageId: t.parent_inquiry_task_id ?? undefined,
                assigned_to_id: t.assigned_to_id ?? undefined,
                assigned_to: t.assigned_to ?? undefined,
                is_auto_only: t.task_library?.is_auto_only ?? false,
            };
        });
}

// ─── Auto-complete rules (data-driven tasks) ────────────────────────

export interface AutoCompleteRule {
    check: (inquiry: Inquiry & { activity_logs?: unknown[] }) => boolean;
    doneLabel: string;
    pendingLabel: string;
}

/** Tasks whose completion is driven by backend data — not manually toggleable. */
export const TASK_AUTO_COMPLETE: Record<string, AutoCompleteRule> = {
    'Inquiry Received': {
        check: (_inq) => true, // Always done once the inquiry is visible in the pipeline
        doneLabel: 'Inquiry received',
        pendingLabel: 'Awaiting inquiry submission',
    },
    'Estimate Preparation': {
        check: (inq) => (inq.estimates?.length ?? 0) > 0,
        doneLabel: 'Estimate drafted',
        pendingLabel: 'Auto-created on inquiry submission',
    },
    'Contract Sent': {
        check: (inq) => (inq.contracts?.some(c => c.status === 'Sent' || c.status === 'Signed') ?? false),
        doneLabel: 'Contract sent to client',
        pendingLabel: 'Accept proposal to auto-send contract',
    },
    'Contract Signed': {
        check: (inq) => (inq.contracts?.some(c => c.status === 'Signed') ?? false),
        doneLabel: 'Contract signed',
        pendingLabel: 'Awaiting client signature',
    },
    'Raise Deposit Invoice': {
        check: (inq) => (inq.invoices?.length ?? 0) > 0,
        doneLabel: 'Deposit invoice created',
        pendingLabel: 'Auto-generated on signing',
    },
    'Block Wedding Date': {
        check: (inq) => inq.status === 'Booked',
        doneLabel: 'Wedding date blocked',
        pendingLabel: 'Mark inquiry as Booked',
    },
};

// ─── Needs assessment grouping categories ────────────────────────────

export const NA_CATEGORIES: NaCategory[] = [
    { label: 'Contact', keys: ['contact_first_name', 'contact_last_name', 'contact_email', 'contact_phone', 'contact_role', 'partner_name'] },
    { label: 'Event', keys: ['event_type', 'wedding_date', 'wedding_date_approx', 'guest_count', 'is_birthday_person', 'birthday_person_name', 'birthday_relation'] },
    { label: 'Venue', keys: ['venue_name', 'venue_details', 'venue_address', 'venue_lat', 'venue_lng', 'venue_region'] },
    { label: 'Package', keys: ['package_path', 'budget_range', 'selected_package'] },
    { label: 'Custom Build', keys: ['builder_activities', 'builder_films', 'operator_count', 'camera_count'] },
    { label: 'Discovery Call', keys: ['discovery_call_interest', 'discovery_call_date', 'discovery_call_time', 'discovery_call_method'] },
    { label: 'Source', keys: ['lead_source', 'lead_source_details'] },
    { label: 'Notes', keys: ['special_requests'] },
];

/** Keys that are internal / transient and should never render in raw-data views */
export const NA_HIDDEN_KEYS = ['builder_step', '_builder_initialized'];
