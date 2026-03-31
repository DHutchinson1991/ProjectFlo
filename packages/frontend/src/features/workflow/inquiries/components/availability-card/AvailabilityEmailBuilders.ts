import type {
    Inquiry,
    InquiryCrewAvailabilityRow,
    InquiryEquipmentAvailabilityRow,
    TaskAutoGenerationPreviewTask,
} from '../../types';
import type { Brand } from '@/features/platform/brand/types';
import type { CrewPaymentTemplate } from '@/features/finance/crew-payment-templates';
import { formatCurrency } from '@projectflo/shared';

export function buildCrewEmailDraft(
    inquiry: Inquiry,
    crewName: string,
    rows: InquiryCrewAvailabilityRow[],
    previewTasks?: TaskAutoGenerationPreviewTask[],
    brand?: Brand | null,
    crewPaymentTemplates?: CrewPaymentTemplate[],
): { subject: string; body: string } {
    const brandName = brand?.display_name ?? brand?.name;
    const eventTypeLabel = inquiry.event_type ?? 'Event';
    const clientName = inquiry.contact?.full_name ?? inquiry.contact?.first_name ?? 'Client';
    const firstName = crewName.split(' ')[0];
    const dateFmt: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const shortDateFmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const eventDateStr = inquiry.event_date
        ? new Date(inquiry.event_date).toLocaleDateString(undefined, dateFmt)
        : null;

    const subject = `Availability Request – ${clientName}'s ${eventTypeLabel}${eventDateStr ? ` · ${eventDateStr}` : ''}`;

    // Split rows into on-site vs off-site
    const onSiteRows = rows.filter((r) => r.is_on_site ?? r.job_role?.on_site ?? false);
    const hasOnSite = onSiteRows.length > 0;

    // On-site time label
    const firstOnSiteDay = onSiteRows[0]?.event_day;
    const onSiteStartTime = firstOnSiteDay?.start_time
        ? new Date(firstOnSiteDay.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
        : null;
    const onSiteDateLabel = [eventDateStr, onSiteStartTime ? `from ${onSiteStartTime}` : null].filter(Boolean).join(' ');

    // Crew role names for matching preview tasks
    const crewRoleNames = new Set(
        rows
            .flatMap((r) => [r.job_role?.display_name, r.job_role?.name, r.label])
            .filter((n): n is string => Boolean(n)),
    );

    const normName = crewName.trim().toLowerCase();

    // Filter production tasks to this crew — exclude admin pipeline phases
    const ADMIN_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);
    const crewTasks = (previewTasks ?? []).filter((t) => {
        if (ADMIN_PHASES.has(t.phase)) return false;
        if (t.assigned_to_name && t.assigned_to_name.trim().toLowerCase() === normName) return true;
        if (t.role_name && crewRoleNames.has(t.role_name)) return true;
        return false;
    });

    // Group tasks into timing buckets
    type TimingGroup = 'before' | 'onday' | 'after';
    const PHASE_TO_GROUP: Partial<Record<string, TimingGroup>> = {
        'Creative_Development': 'before',
        'Pre_Production': 'before',
        'Production': 'onday',
        'Post_Production': 'after',
        'Delivery': 'after',
    };

    // Compute date window label from due_date_offset_days within a group of tasks
    const dateWindowLabel = (tasks: TaskAutoGenerationPreviewTask[]): string => {
        if (!inquiry.event_date) return '';
        const eventMs = new Date(inquiry.event_date).getTime();
        const offsets = tasks
            .map((t) => t.due_date_offset_days)
            .filter((d): d is number => d != null);
        if (offsets.length === 0) return '';
        const min = Math.min(...offsets);
        const max = Math.max(...offsets);
        const earliest = new Date(eventMs + min * 86_400_000).toLocaleDateString(undefined, shortDateFmt);
        const latest = new Date(eventMs + max * 86_400_000).toLocaleDateString(undefined, shortDateFmt);
        return earliest === latest ? ` (${earliest})` : ` (${earliest} – ${latest})`;
    };

    const buildGroupBlock = (label: string, tasks: TaskAutoGenerationPreviewTask[]): string | null => {
        if (tasks.length === 0) return null;
        const window = dateWindowLabel(tasks);
        const taskLines = tasks.map((t) => `  • ${t.name} — ${t.total_hours}h`);
        return [`${label}${window}`, ...taskLines].join('\n');
    };

    // Group tasks by role
    const tasksByRole = new Map<string, TaskAutoGenerationPreviewTask[]>();
    for (const t of crewTasks) {
        const rn = t.role_name ?? 'General';
        if (!tasksByRole.has(rn)) tasksByRole.set(rn, []);
        tasksByRole.get(rn)!.push(t);
    }

    const lines: string[] = [];
    lines.push(`Hi ${firstName},`);
    lines.push('');
    if (brandName) {
        lines.push(`I'm reaching out from ${brandName}.`);
        lines.push('');
    }

    // Opening line
    const eventLabel = inquiry.event_type ?? 'upcoming event';
    if (hasOnSite) {
        const onSiteVenue = [inquiry.venue_details, inquiry.venue_address].filter(Boolean).join(', ') || null;
        lines.push(`I'd like to check your availability for ${clientName}'s ${eventLabel}.`);
        lines.push('');
        if (inquiry.event_type) lines.push(`Event type: ${inquiry.event_type}`);
        if (eventDateStr) lines.push(`Event date: ${eventDateStr}`);
        if (onSiteVenue) lines.push(`Venue: ${onSiteVenue}`);
        lines.push(`On-site: Yes`);
        lines.push('');
        let onSiteLine = `You'll be required on site${onSiteDateLabel ? ` on ${onSiteDateLabel}` : ''}`;
        if (onSiteVenue) onSiteLine += ` at ${onSiteVenue}`;
        onSiteLine += '.';
        lines.push(onSiteLine);
    } else {
        lines.push(`I'd like to check your availability to work on ${clientName}'s ${eventLabel}.`);
        lines.push('');
        if (inquiry.event_type) lines.push(`Event type: ${inquiry.event_type}`);
        if (eventDateStr) lines.push(`Event date: ${eventDateStr}`);
        lines.push('On-site: No');
    }

    if (crewTasks.length > 0) {
        lines.push('');
        lines.push("Here's a breakdown of the work involved:");
        lines.push('');

        const multipleRoles = tasksByRole.size > 1;
        for (const [roleName, roleTasks] of tasksByRole) {
            if (multipleRoles) {
                lines.push(roleName.toUpperCase());
                lines.push('');
            }

            const roleGroups: Record<TimingGroup, TaskAutoGenerationPreviewTask[]> = { before: [], onday: [], after: [] };
            for (const t of roleTasks) {
                const group = PHASE_TO_GROUP[t.phase];
                if (group) roleGroups[group].push(t);
            }

            const beforeBlock = buildGroupBlock('BEFORE THE EVENT', roleGroups.before);
            const ondayBlock = buildGroupBlock('ON THE DAY', roleGroups.onday);
            const afterBlock = buildGroupBlock('AFTER THE EVENT', roleGroups.after);

            if (beforeBlock) { lines.push(beforeBlock); lines.push(''); }
            if (ondayBlock) { lines.push(ondayBlock); lines.push(''); }
            if (afterBlock) { lines.push(afterBlock); lines.push(''); }

            if (multipleRoles) {
                const roleHours = roleTasks.reduce((s, t) => s + (t.total_hours ?? 0), 0);
                const roleCost = roleTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);
                lines.push(roleCost > 0 ? `Subtotal: ${roleHours}h  (${formatCurrency(roleCost)})` : `Subtotal: ${roleHours}h`);
                lines.push('');
            }
        }

        const totalHours = crewTasks.reduce((s, t) => s + (t.total_hours ?? 0), 0);
        const totalCost = crewTasks.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);
        lines.push(totalCost > 0 ? `Total commitment: ${totalHours}h  (${formatCurrency(totalCost)})` : `Total commitment: ${totalHours}h`);
    } else {
        lines.push('');
        lines.push('Roles required:');
        for (const r of rows) {
            const role = r.job_role?.display_name ?? r.job_role?.name ?? r.label ?? 'Role';
            lines.push(`  • ${role}`);
        }
    }

    // Payment terms — prefer structured templates, fall back to brand.crew_payment_terms
    const isOnSite = rows.some((r) => r.is_on_site ?? r.job_role?.on_site ?? false);
    const roleType = isOnSite ? 'on_site' : 'off_site';
    const matchedTemplate = crewPaymentTemplates
        ?.filter((t) => t.role_type === roleType && t.is_active)
        .find((t) => t.is_default) ?? crewPaymentTemplates?.find((t) => t.role_type === roleType && t.is_active);

    if (matchedTemplate && matchedTemplate.rules.length > 0) {
        const TRIGGER_LABELS: Record<string, string> = {
            ON_BOOKING: 'on booking confirmation',
            ON_SHOOT_DAY: 'on shoot day',
            ON_COMPLETION: 'on completion',
            AFTER_DELIVERY: 'after final delivery',
            BEFORE_EVENT: 'before the event',
            AFTER_EVENT: 'after the event',
            ON_FIRST_EDIT: 'when editing begins',
            AFTER_ROUGH_CUT: 'after rough cut',
            NET_DAYS: 'net days',
            ON_TASK_COMPLETE: 'on task completion',
            RECURRING: 'recurring',
        };
        const ruleDescs = matchedTemplate.rules
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((r) => {
                const pct = `${Number(r.amount_value)}%`;
                let trigger = TRIGGER_LABELS[r.trigger_type] ?? r.trigger_type;
                if (r.trigger_type === 'AFTER_DELIVERY' && r.trigger_days) {
                    trigger = `within ${r.trigger_days} days of final delivery`;
                } else if (r.trigger_type === 'BEFORE_EVENT' && r.trigger_days) {
                    trigger = `${r.trigger_days} days before the event`;
                } else if (r.trigger_type === 'AFTER_EVENT' && r.trigger_days) {
                    trigger = `${r.trigger_days} days after the event`;
                } else if (r.trigger_type === 'AFTER_ROUGH_CUT' && r.trigger_days) {
                    trigger = `${r.trigger_days} days after rough cut`;
                } else if (r.trigger_type === 'NET_DAYS' && r.trigger_days) {
                    trigger = `net ${r.trigger_days} days`;
                } else if (r.trigger_type === 'ON_TASK_COMPLETE') {
                    trigger = r.label ? r.label.toLowerCase() : 'on task completion';
                } else if (r.trigger_type === 'RECURRING') {
                    const freqLabel = r.frequency === 'WEEKLY' ? 'weekly' : r.frequency === 'FORTNIGHTLY' ? 'fortnightly' : 'monthly';
                    trigger = freqLabel;
                }
                return `${pct} ${trigger}`;
            });
        const paymentTermsStr = ruleDescs.join(', ');
        lines.push('');
        lines.push(`Payment: ${paymentTermsStr}`);
        // Append invoice terms if present
        const termsLabel: Record<string, string> = { DUE_ON_RECEIPT: 'due on receipt', NET_7: 'within 7 days', NET_14: 'within 14 days', NET_30: 'within 30 days', NET_60: 'within 60 days' };
        const invoiceTerms = matchedTemplate.payment_terms;
        if (invoiceTerms && termsLabel[invoiceTerms]) {
            lines.push(`Invoices ${termsLabel[invoiceTerms]}.`);
        }
    } else {
        const paymentTerms = brand?.crew_payment_terms;
        if (paymentTerms) {
            lines.push('');
            lines.push(`Payment: ${paymentTerms}`);
        }
    }

    // Next steps
    lines.push('');
    lines.push('Next steps: Upon booking confirmation, I\'ll send over the crew agreement and schedule a kick-off call.');

    // Inquiry validity
    const validityDays = brand?.inquiry_validity_days ?? 14;
    lines.push('');
    lines.push(`This offer is valid for ${validityDays} days from the date of this email.`);

    // CTA with explicit options
    lines.push('');
    lines.push('Could you let me know your availability? You can simply reply with:');
    lines.push('  ✓ Available');
    lines.push('  ✗ Unavailable');
    lines.push('  ? Need to discuss');

    // Response deadline
    const deadlineDays = brand?.crew_response_deadline_days ?? 5;
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);
    const deadlineStr = deadlineDate.toLocaleDateString(undefined, dateFmt);
    lines.push('');
    lines.push(`Please respond by ${deadlineStr}.`);

    lines.push('');
    lines.push('Many thanks,');
    lines.push(inquiry.lead_producer?.name ?? 'The Team');

    return { subject, body: lines.join('\n') };
}

export function buildEquipmentEmailDraft(
    inquiry: Inquiry,
    ownerName: string,
    rows: InquiryEquipmentAvailabilityRow[],
    brand?: Brand | null,
): { subject: string; body: string } {
    const eventDateLong = inquiry.event_date
        ? new Date(inquiry.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : null;
    const eventDateShort = inquiry.event_date
        ? new Date(inquiry.event_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
        : null;

    const fmtRate = (n: number | null | undefined) => n != null ? formatCurrency(n) : '';
    const clientName = inquiry.contact?.full_name ?? inquiry.contact?.first_name ?? 'Client';
    const eventTypeLabel = inquiry.event_type ?? 'Event';
    const venue = [inquiry.venue_details, inquiry.venue_address].filter(Boolean).join(', ') || null;
    const brandName = brand?.display_name ?? brand?.name;
    const ownerFirstName = ownerName.split(' ')[0] || ownerName;

    const subject = `Equipment Reservation – ${clientName}'s ${eventTypeLabel}${eventDateShort ? ` · ${eventDateShort}` : ''}`;

    const uniqueDays = new Set(
        rows
            .map((r) => r.event_day?.date)
            .filter((d): d is string => Boolean(d))
            .map((d) => d.slice(0, 10)),
    );
    const rentalDays = Math.max(1, uniqueDays.size);

    const uniqueEquipment = new Map<string, InquiryEquipmentAvailabilityRow>();
    for (const row of rows) {
        const key = String((row.equipment as { id?: number }).id ?? row.equipment.item_name);
        if (!uniqueEquipment.has(key)) {
            uniqueEquipment.set(key, row);
        }
    }

    const totalDailyRate = Array.from(uniqueEquipment.values()).reduce(
        (sum, row) => sum + (row.equipment.rental_price_per_day ?? 0),
        0,
    );
    const totalEstimate = totalDailyRate * rentalDays;

    const equipmentLines = rows.map((row) => {
        const equipmentName = row.equipment?.item_name ?? 'Equipment';
        const equipmentCategory = row.equipment?.category;
        const rentalRate = row.equipment.rental_price_per_day;
        const rate = rentalRate != null ? ` — ${fmtRate(rentalRate)}/day` : '';
        return `  • ${equipmentName}${equipmentCategory ? ` (${equipmentCategory})` : ''}${rate}`;
    });

    const lines: string[] = [];
    lines.push(`Hi ${ownerFirstName},`);
    lines.push('');
    if (brandName) {
        lines.push(`I'm reaching out from ${brandName}.`);
        lines.push('');
    }
    lines.push(`I'd like to arrange equipment for ${clientName}'s ${eventTypeLabel}.`);
    lines.push('');

    // Event details block
    if (eventTypeLabel !== 'Event') lines.push(`Event type: ${eventTypeLabel}`);
    if (eventDateLong) lines.push(`Date: ${eventDateLong}`);
    if (venue) lines.push(`Venue: ${venue}`);
    lines.push(`Estimated rental period: ${rentalDays} day${rentalDays !== 1 ? 's' : ''}`);
    lines.push('');

    lines.push(`I'd like to reserve the following item${rows.length !== 1 ? 's' : ''} from you:`);
    lines.push('');
    lines.push(...equipmentLines);
    if (totalEstimate > 0) {
        lines.push('');
        lines.push(`Estimated total: ${fmtRate(totalEstimate)} (${fmtRate(totalDailyRate)}/day \u00d7 ${rentalDays} day${rentalDays !== 1 ? 's' : ''})`);
    }
    lines.push('');
    lines.push('Could you confirm availability and let me know your preferred handover method for these items?');
    lines.push('Delivery / Collection / Either');
    lines.push('');
    lines.push('You can simply reply with:');
    lines.push('  ✓ Available');
    lines.push('  ✗ Unavailable');
    lines.push('  ? Need to discuss logistics');
    const deadlineDays = brand?.crew_response_deadline_days ?? 5;
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);
    lines.push('');
    lines.push(`If possible, please respond by ${deadlineDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.`);
    lines.push('');
    lines.push("If you have any questions or if anything has changed, don't hesitate to get in touch.");
    lines.push('');
    lines.push('Many thanks,');
    lines.push(inquiry.lead_producer?.name ?? 'The Team');

    return { subject, body: lines.join('\n') };
}
