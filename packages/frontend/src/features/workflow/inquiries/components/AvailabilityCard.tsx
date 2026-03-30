'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    LinearProgress,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    CheckCircle,
    ErrorOutline,
    MoreVert,
    Send,
    EventAvailable,
    SwapHoriz,
    WarningAmber,
    Videocam,
    WorkOutline,
} from '@mui/icons-material';
import {
    Inquiry,
    InquiryAvailabilityResponse,
    InquiryCrewAvailabilityRow,
    InquiryEquipmentAvailabilityRow,
    InquiryTask,
    TaskAutoGenerationPreviewTask,
} from '@/features/workflow/inquiries/types';
import type { Brand } from '@/features/platform/brand/types';
import { useCrewPaymentTemplates } from '@/features/finance/crew-payment-templates';
import type { CrewPaymentTemplate } from '@/features/finance/crew-payment-templates';
import { crewSlotsApi } from '@/features/workflow/scheduling/shared';
import { taskLibraryApi } from '@/features/catalog/task-library/api';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { useBrand } from '@/features/platform/brand';
import { formatCurrency } from '@projectflo/shared';
import CrewAvailabilityRequestDialog from './CrewAvailabilityRequestDialog';
import EquipmentReservationDialog from './EquipmentReservationDialog';

interface AvailabilityCardProps {
    inquiry: Inquiry;
    inquiryTasks?: InquiryTask[];
    isActive?: boolean;
    activeColor?: string;
    onTasksChanged?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
}

type RequestState = { id: number; status: 'pending' | 'confirmed' | 'declined' | 'cancelled' };
type RequestMap = Map<number, RequestState>; // keyed by crew_id
type ReservationState = { id: number; status: 'reserved' | 'confirmed' | 'cancelled' };
type ReservationMap = Map<number, ReservationState>; // keyed by assignment id (row.id)
type CrewDialogState = {
    crewId: number;
    crewName: string;
    crewEmail?: string | null;
    rows: InquiryCrewAvailabilityRow[];
    requestState?: RequestState;
    emailSubject: string;
    emailBody: string;
    previewTasks?: TaskAutoGenerationPreviewTask[];
    eventDate?: Date | string | null;
    venueDetails?: string | null;
    eventType?: string | null;
    clientName?: string;
    brandName?: string;
};
type EquipmentDialogState = {
    ownerId: number;
    ownerName: string;
    ownerEmail?: string | null;
    rows: InquiryEquipmentAvailabilityRow[];
    reservationStates: Map<number, ReservationState>;
    emailSubject: string;
    emailBody: string;
};

// ─── Email draft helpers ──────────────────────────────────────────────────────
function buildCrewEmailDraft(
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
        const onSiteVenue = inquiry.venue_details ?? inquiry.venue_address ?? null;
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

function buildEquipmentEmailDraft(
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
    const venue = inquiry.venue_details ?? inquiry.venue_address ?? null;
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

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ crewConflicts, equipmentConflicts, crewTotal, equipmentTotal, crewReady, equipmentReady }: {
    crewConflicts: number; equipmentConflicts: number; crewTotal: number; equipmentTotal: number;
    crewReady: number; equipmentReady: number;
}) {
    const totalConflicts = crewConflicts + equipmentConflicts;
    const isAllClear = totalConflicts === 0;
    const accentColor = isAllClear ? '#10b981' : '#f59e0b';
    const totalReady = crewReady + equipmentReady;
    const totalItems = crewTotal + equipmentTotal;
    const progress = totalItems > 0 ? (totalReady / totalItems) * 100 : 0;

    return (
        <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: `1px solid ${isAllClear ? 'rgba(16,185,129,0.16)' : 'rgba(245,158,11,0.16)'}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.8, bgcolor: isAllClear ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)' }}>
                {isAllClear ? (
                    <CheckCircle sx={{ fontSize: 15, color: '#10b981', flexShrink: 0 }} />
                ) : (
                    <WarningAmber sx={{ fontSize: 15, color: '#f59e0b', flexShrink: 0 }} />
                )}
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: accentColor }}>
                    {isAllClear ? 'All clear' : `${totalConflicts} conflict${totalConflicts !== 1 ? 's' : ''}`}
                </Typography>
                <Typography sx={{ fontSize: '0.67rem', color: '#64748b', ml: 'auto' }}>
                    {crewReady}/{crewTotal} crew · {equipmentReady}/{equipmentTotal} gear
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    height: 2,
                    bgcolor: 'rgba(15,23,42,0.5)',
                    '& .MuiLinearProgress-bar': { bgcolor: progress === 100 ? '#10b981' : progress > 0 ? '#3b82f6' : '#334155' },
                }}
            />
        </Box>
    );
}

// ─── Request Badge ─────────────────────────────────────────────────────────────
function RequestBadge({
    requestState,
    onSend,
    onUpdateStatus,
    onDirectConfirm,
    sending,
}: {
    requestState?: RequestState;
    onSend: () => void;
    onUpdateStatus: (status: 'confirmed' | 'declined' | 'cancelled') => void;
    onDirectConfirm?: () => void;
    sending?: boolean;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (sending) {
        return <CircularProgress size={14} sx={{ color: '#64748b' }} />;
    }

    if (!requestState) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Tooltip title="Send availability request" arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={onSend}
                        sx={{
                            p: 0.5,
                            color: '#64748b',
                            border: '1px solid rgba(148,163,184,0.2)',
                            bgcolor: 'rgba(148,163,184,0.05)',
                            '&:hover': { color: '#60a5fa', bgcolor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' },
                        }}
                    >
                        <Send sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94a3b8' } }}
                >
                    <MoreVert sx={{ fontSize: 14 }} />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid rgba(52,58,68,0.5)', minWidth: 160 } }}
                >
                    {onDirectConfirm && (
                        <MenuItem
                            dense
                            sx={{ fontSize: '0.8rem', color: '#10b981' }}
                            onClick={() => { onDirectConfirm(); setAnchorEl(null); }}
                        >
                            Mark as Confirmed
                        </MenuItem>
                    )}
                </Menu>
            </Box>
        );
    }

    const statusConfig = {
        pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        confirmed: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
        declined: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
        cancelled: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
    }[requestState.status];

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Chip
                    size="small"
                    label={statusConfig.label}
                    sx={{
                        height: 22,
                        color: statusConfig.color,
                        bgcolor: statusConfig.bg,
                        border: `1px solid ${statusConfig.border}`,
                        fontSize: '0.7rem',
                    }}
                />
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94a3b8' } }}
                >
                    <MoreVert sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid rgba(52,58,68,0.5)', minWidth: 160 } }}
            >
                {requestState.status !== 'confirmed' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#10b981' }}
                        onClick={() => { onUpdateStatus('confirmed'); setAnchorEl(null); }}
                    >
                        Mark as Confirmed
                    </MenuItem>
                )}
                {requestState.status !== 'declined' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#ef4444' }}
                        onClick={() => { onUpdateStatus('declined'); setAnchorEl(null); }}
                    >
                        Mark as Declined
                    </MenuItem>
                )}
                {requestState.status !== 'pending' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
                        onClick={() => { onSend(); setAnchorEl(null); }}
                    >
                        Resend Request
                    </MenuItem>
                )}
                {requestState.status !== 'cancelled' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#64748b' }}
                        onClick={() => { onUpdateStatus('cancelled'); setAnchorEl(null); }}
                    >
                        Cancel Request
                    </MenuItem>
                )}
            </Menu>
        </>
    );
}

// ─── Reserve Badge ─────────────────────────────────────────────────────────────
function ReserveBadge({
    reservationState,
    onReserve,
    onUpdateStatus,
    onDirectConfirm,
    reserving,
    owner,
}: {
    reservationState?: ReservationState;
    onReserve: () => void;
    onUpdateStatus: (status: 'confirmed' | 'cancelled') => void;
    onDirectConfirm?: () => void;
    reserving?: boolean;
    owner?: { name: string; email?: string | null; phone?: string | null } | null;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (reserving) {
        return <CircularProgress size={14} sx={{ color: '#64748b' }} />;
    }

    const status = reservationState?.status;
    const isActive = status === 'reserved' || status === 'confirmed';

    if (!isActive) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Tooltip title="Send reservation request" arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={onReserve}
                        sx={{
                            p: 0.5,
                            color: '#64748b',
                            border: '1px solid rgba(148,163,184,0.2)',
                            bgcolor: 'rgba(148,163,184,0.05)',
                            '&:hover': { color: '#34d399', bgcolor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
                        }}
                    >
                        <EventAvailable sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94a3b8' } }}
                >
                    <MoreVert sx={{ fontSize: 14 }} />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid rgba(52,58,68,0.5)', minWidth: 160 } }}
                >
                    {onDirectConfirm && (
                        <MenuItem
                            dense
                            sx={{ fontSize: '0.8rem', color: '#10b981' }}
                            onClick={() => { onDirectConfirm(); setAnchorEl(null); }}
                        >
                            Mark as Confirmed
                        </MenuItem>
                    )}
                </Menu>
            </Box>
        );
    }

    const statusConfig = {
        reserved: { label: 'Reserved', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        confirmed: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    }[status as 'reserved' | 'confirmed'];

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Chip
                    size="small"
                    label={statusConfig.label}
                    sx={{
                        height: 22,
                        color: statusConfig.color,
                        bgcolor: statusConfig.bg,
                        border: `1px solid ${statusConfig.border}`,
                        fontSize: '0.7rem',
                    }}
                />
                <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#94a3b8' } }}
                >
                    <MoreVert sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid rgba(52,58,68,0.5)', minWidth: 160 } }}
            >
                {status !== 'confirmed' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#10b981' }}
                        onClick={() => { onUpdateStatus('confirmed'); setAnchorEl(null); }}
                    >
                        Mark as Confirmed
                    </MenuItem>
                )}
                {status !== 'reserved' && (
                    <MenuItem
                        dense
                        sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
                        onClick={() => { onReserve(); setAnchorEl(null); }}
                    >
                        Resend Request
                    </MenuItem>
                )}
                {owner?.email && (
                    <MenuItem
                        dense
                        component="a"
                        href={`mailto:${owner.email}`}
                        sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
                        onClick={() => setAnchorEl(null)}
                    >
                        Contact Owner
                    </MenuItem>
                )}
                <MenuItem
                    dense
                    sx={{ fontSize: '0.8rem', color: '#ef4444' }}
                    onClick={() => { onUpdateStatus('cancelled'); setAnchorEl(null); }}
                >
                    Cancel Reservation
                </MenuItem>
            </Menu>
        </>
    );
}

function formatEventDay(date?: string, start?: string | null, end?: string | null) {
    const parts: string[] = [];
    if (date) {
        parts.push(new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    }
    if (start || end) {
        parts.push([start, end].filter(Boolean).join(' – '));
    }
    return parts.join(' · ');
}

function formatDayHeader(date: string, start?: string | null, end?: string | null) {
    const d = new Date(date);
    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const time = [start, end].filter(Boolean).join(' – ');
    return time ? `${label}  ·  ${time}` : label;
}

// ─── Crew Row ─────────────────────────────────────────────────────────────────
function CrewRow({
    row,
    onSwap,
    swapping,
}: {
    row: InquiryCrewAvailabilityRow;
    onSwap?: (slotId: number, alternativeCrewId: number) => void;
    swapping?: boolean;
}) {
    const [showAlternatives, setShowAlternatives] = useState(false);
    const rawName = row.label || row.job_role?.display_name || row.job_role?.name || 'Crew Slot';
    const roleName = rawName.replace(/\s*\(.*\)$/, '');
    const nonCurrentAlts = row.alternatives
        .filter((a) => !a.is_current)
        .sort((a, b) => (b.has_role ? 1 : 0) - (a.has_role ? 1 : 0));
    const hasAlternatives = nonCurrentAlts.length > 0;
    const isConflict = row.has_conflict;
    const accentColor = isConflict ? '#f59e0b' : '#10b981';

    const alternativesBlock = hasAlternatives && showAlternatives ? (
        <Box sx={{ mt: 0.8, pl: 0.5 }}>
            {swapping ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5 }}>
                    <CircularProgress size={12} sx={{ color: '#60a5fa' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Reassigning…</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {nonCurrentAlts.map((alt) => {
                        const hasConflict = (alt.conflicts?.length ?? 0) > 0;
                        const tooltip = hasConflict
                            ? `Conflict: ${alt.conflicts![0].title}`
                            : !alt.has_role ? 'No matching role' : '';
                        return (
                            <Tooltip key={alt.id} title={tooltip} arrow placement="top">
                                <Chip
                                    size="small"
                                    label={alt.name}
                                    onClick={onSwap ? () => onSwap(row.id, alt.id) : undefined}
                                    sx={{
                                        height: 22, fontSize: '0.7rem',
                                        color: hasConflict ? '#fcd34d' : !alt.has_role ? '#94a3b8' : '#cbd5e1',
                                        bgcolor: hasConflict ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                                        border: `1px solid ${hasConflict ? 'rgba(245,158,11,0.25)' : !alt.has_role ? 'rgba(100,116,139,0.2)' : 'rgba(59,130,246,0.16)'}`,
                                        cursor: onSwap ? 'pointer' : 'default',
                                        ...(onSwap ? { '&:hover': { bgcolor: hasConflict ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.18)', borderColor: hasConflict ? 'rgba(245,158,11,0.45)' : 'rgba(59,130,246,0.35)' } } : {}),
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                </Box>
            )}
        </Box>
    ) : null;

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            pl: 1.25, pr: 1, py: 0.6,
            borderRadius: 1.5,
            borderLeft: `3px solid ${accentColor}`,
            bgcolor: isConflict ? 'rgba(245,158,11,0.04)' : 'rgba(15,23,42,0.3)',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                        {roleName}
                    </Typography>
                    {isConflict && row.conflict_reason && (
                        <Typography sx={{ fontSize: '0.68rem', color: '#fcd34d', mt: 0.1 }}>
                            {row.conflict_reason}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                    {hasAlternatives && (
                        <Tooltip title={showAlternatives ? 'Hide options' : 'Reassign'} arrow placement="top">
                            <IconButton
                                size="small"
                                onClick={() => setShowAlternatives(!showAlternatives)}
                                sx={{
                                    p: 0.4,
                                    color: showAlternatives ? '#60a5fa' : '#475569',
                                    '&:hover': { color: '#60a5fa', bgcolor: 'rgba(59,130,246,0.1)' },
                                }}
                            >
                                <SwapHoriz sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {isConflict ? (
                        <Tooltip title={row.status === 'unassigned' ? 'Unassigned' : 'Scheduling conflict'} arrow placement="top">
                            <WarningAmber sx={{ fontSize: 14, color: '#f59e0b' }} />
                        </Tooltip>
                    ) : (
                        <CheckCircle sx={{ fontSize: 14, color: '#10b981' }} />
                    )}
                </Box>
            </Box>
            {isConflict && row.conflicts.length > 0 && (
                <Stack spacing={0.3} sx={{ mt: 0.4 }}>
                    {row.conflicts.map((conflict) => (
                        <Box key={`${conflict.type}-${conflict.id}-${conflict.event_day_name}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ErrorOutline sx={{ fontSize: 11, color: '#f59e0b' }} />
                            <Typography sx={{ fontSize: '0.68rem', color: '#fcd34d' }}>
                                {conflict.title}{conflict.event_day_name ? ` · ${conflict.event_day_name}` : ''}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            )}
            {alternativesBlock}
        </Box>
    );
}

// ─── Equipment Row ─────────────────────────────────────────────────────────────
function EquipmentRow({
    row,
    reservationState,
    onSwap,
    swapping,
}: {
    row: InquiryEquipmentAvailabilityRow;
    reservationState?: ReservationState;
    onSwap?: (assignmentId: number, newEquipmentId: number) => void;
    swapping?: boolean;
}) {
    const [showAlternatives, setShowAlternatives] = useState(false);
    const status = reservationState?.status;
    const isActive = status === 'reserved' || status === 'confirmed';
    const isConflict = row.has_conflict;
    const nonCurrentAlts = row.alternatives.filter((a) => !a.is_current);
    const hasAlternatives = nonCurrentAlts.length > 0;

    const dotColor = status === 'confirmed' ? '#10b981' : isActive ? '#f59e0b' : '#334155';
    const dotBorder = status === 'confirmed' ? '#10b981' : isActive ? '#f59e0b' : '#475569';
    const dotLabel = status === 'confirmed' ? 'Confirmed' : status === 'reserved' ? 'Reserved' : 'Not reserved';
    const accentColor = isConflict ? '#f59e0b' : isActive ? '#10b981' : '#334155';

    const alternativesBlock = hasAlternatives && showAlternatives ? (
        <Box sx={{ mt: 0.8, pl: 0.5 }}>
            {swapping ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5 }}>
                    <CircularProgress size={12} sx={{ color: '#60a5fa' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Swapping…</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {nonCurrentAlts.map((alt) => {
                        const hasConflict = (alt.conflicts?.length ?? 0) > 0;
                        const tooltip = hasConflict
                            ? `Conflict: ${alt.conflicts![0].title}`
                            : '';
                        return (
                            <Tooltip key={alt.id} title={tooltip} arrow placement="top">
                                <Chip
                                    size="small"
                                    label={alt.item_name}
                                    onClick={onSwap ? () => onSwap(row.id, alt.id) : undefined}
                                    sx={{
                                        height: 22, fontSize: '0.7rem',
                                        color: hasConflict ? '#fcd34d' : '#cbd5e1',
                                        bgcolor: hasConflict ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                                        border: `1px solid ${hasConflict ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.16)'}`,
                                        cursor: onSwap ? 'pointer' : 'default',
                                        ...(onSwap ? { '&:hover': { bgcolor: hasConflict ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.18)', borderColor: hasConflict ? 'rgba(245,158,11,0.45)' : 'rgba(59,130,246,0.35)' } } : {}),
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                </Box>
            )}
        </Box>
    ) : null;

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            pl: 1.25, pr: 1, py: 0.6,
            borderRadius: 1.5,
            borderLeft: `3px solid ${accentColor}`,
            bgcolor: isConflict ? 'rgba(245,158,11,0.04)' : 'rgba(15,23,42,0.3)',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                        {row.equipment.item_name}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: '0.65rem', color: '#64748b', mt: 0.1 }}>
                        {formatEventDay(row.event_day?.date, row.event_day?.start_time, row.event_day?.end_time) || 'No day set'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {hasAlternatives && (
                        <Tooltip title={showAlternatives ? 'Hide options' : 'Swap'} arrow placement="top">
                            <IconButton
                                size="small"
                                onClick={() => setShowAlternatives(!showAlternatives)}
                                sx={{
                                    p: 0.4,
                                    color: showAlternatives ? '#60a5fa' : '#475569',
                                    '&:hover': { color: '#60a5fa', bgcolor: 'rgba(59,130,246,0.1)' },
                                }}
                            >
                                <SwapHoriz sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {isConflict && (
                        <Tooltip title="Scheduling conflict" arrow placement="top">
                            <WarningAmber sx={{ fontSize: 13, color: '#f59e0b' }} />
                        </Tooltip>
                    )}
                    <Tooltip title={dotLabel} arrow placement="top">
                        <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: dotColor, border: `1.5px solid ${dotBorder}`,
                            flexShrink: 0,
                        }} />
                    </Tooltip>
                </Box>
            </Box>
            {isConflict && row.conflict_reason && (
                <Typography sx={{ fontSize: '0.68rem', color: '#fcd34d', mt: 0.3 }}>
                    {row.conflict_reason}
                </Typography>
            )}
            {alternativesBlock}
        </Box>
    );
}

// ─── Main Card ─────────────────────────────────────────────────────────────────
const AvailabilityCard: React.FC<AvailabilityCardProps> = ({ inquiry, isActive, activeColor, onTasksChanged, WorkflowCard }) => {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const [crew, setCrew] = useState<InquiryAvailabilityResponse<InquiryCrewAvailabilityRow> | null>(null);
    const [equipment, setEquipment] = useState<InquiryAvailabilityResponse<InquiryEquipmentAvailabilityRow> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<RequestMap>(new Map());
    const [sending, setSending] = useState<Set<number>>(new Set());
    const [reservations, setReservations] = useState<ReservationMap>(new Map());
    const [reserving, setReserving] = useState<Set<number>>(new Set());
    const [crewDialogState, setCrewDialogState] = useState<CrewDialogState | null>(null);
    const [crewDialogError, setCrewDialogError] = useState<string | null>(null);
    const [equipmentDialogState, setEquipmentDialogState] = useState<EquipmentDialogState | null>(null);
    const [equipmentDialogError, setEquipmentDialogError] = useState<string | null>(null);
    const { data: crewPaymentTemplates = [] } = useCrewPaymentTemplates();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const refreshAvailability = useCallback(async () => {
        try {
            const [crewData, equipmentData] = await Promise.all([
                inquiriesApi.getCrewAvailability(inquiry.id),
                inquiriesApi.getEquipmentAvailability(inquiry.id),
            ]);
            if (!isMounted.current) return;
            setCrew(crewData);
            setEquipment(equipmentData);
            const initialRequests: RequestMap = new Map();
            for (const row of crewData.rows) {
                if (row.assigned_crew && row.availability_request_id && row.availability_request_status) {
                    initialRequests.set(row.assigned_crew.id, {
                        id: row.availability_request_id,
                        status: row.availability_request_status as RequestState['status'],
                    });
                }
            }
            setRequests(initialRequests);
            const initialReservations: ReservationMap = new Map();
            for (const row of equipmentData.rows) {
                if (row.equipment_reservation_id && row.equipment_reservation_status) {
                    initialReservations.set(row.id, {
                        id: row.equipment_reservation_id,
                        status: row.equipment_reservation_status as ReservationState['status'],
                    });
                }
            }
            setReservations(initialReservations);
            setError(null);
        } catch (err) {
            console.error('Failed to load inquiry availability', err);
            if (isMounted.current) setError('Failed to load live crew and equipment availability.');
        }
    }, [inquiry.id, brandId]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            await refreshAvailability();
            if (!cancelled) {
                setLoading(false);
                // Backend syncs subtasks during availability fetch;
                // re-fetch tasks so QualifyCard sees updated statuses.
                onTasksChanged?.();
            }
        }
        load();
        return () => { cancelled = true; };
    }, [refreshAvailability]);

    const handleSendRequest = useCallback(async (row: InquiryCrewAvailabilityRow) => {
        if (!row.assigned_crew) return;
        const crewId = row.assigned_crew.id;
        setSending((prev) => new Set(prev).add(crewId));
        try {
            const result = await inquiriesApi.sendAvailabilityRequest(inquiry.id, {
                crew_id: crewId,
                project_crew_slot_id: row.id,
            });
            if (isMounted.current) {
                setRequests((prev) => new Map(prev).set(crewId, { id: result.id, status: result.status as RequestState['status'] }));
            }
        } catch (err) {
            console.error('Failed to send availability request', err);
        } finally {
            if (isMounted.current) setSending((prev) => { const s = new Set(prev); s.delete(crewId); return s; });
        }
    }, [inquiry.id]);

    const handleUpdateStatus = useCallback(async (
        crewId: number,
        requestId: number,
        status: 'confirmed' | 'declined' | 'cancelled',
    ) => {
        setSending((prev) => new Set(prev).add(crewId));
        try {
            const result = await inquiriesApi.updateAvailabilityRequest(inquiry.id, requestId, status);
            if (isMounted.current) {
                setRequests((prev) => new Map(prev).set(crewId, { id: result.id, status: result.status as RequestState['status'] }));
            }
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to update availability request', err);
        } finally {
            if (isMounted.current) setSending((prev) => { const s = new Set(prev); s.delete(crewId); return s; });
        }
    }, [inquiry.id, onTasksChanged]);

    const handleReserveEquipment = useCallback(async (row: InquiryEquipmentAvailabilityRow) => {
        const assignmentId = row.id;
        setReserving((prev) => new Set(prev).add(assignmentId));
        try {
            const result = await inquiriesApi.reserveEquipment(inquiry.id, assignmentId);
            if (isMounted.current) {
                setReservations((prev) => new Map(prev).set(assignmentId, { id: result.id, status: result.status as ReservationState['status'] }));
            }
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to reserve equipment', err);
        } finally {
            if (isMounted.current) setReserving((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id, onTasksChanged]);

    const handleCancelReservation = useCallback(async (row: InquiryEquipmentAvailabilityRow) => {
        const assignmentId = row.id;
        const reservation = reservations.get(assignmentId);
        if (!reservation) return;
        setReserving((prev) => new Set(prev).add(assignmentId));
        try {
            await inquiriesApi.cancelEquipmentReservation(inquiry.id, reservation.id);
            if (isMounted.current) {
                setReservations((prev) => new Map(prev).set(assignmentId, { id: reservation.id, status: 'cancelled' }));
            }
        } catch (err) {
            console.error('Failed to cancel equipment reservation', err);
        } finally {
            if (isMounted.current) setReserving((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id, reservations]);

    const handleUpdateEquipmentStatus = useCallback(async (
        assignmentId: number,
        reservationId: number,
        status: 'confirmed' | 'cancelled',
    ) => {
        setReserving((prev) => new Set(prev).add(assignmentId));
        try {
            await inquiriesApi.updateEquipmentReservation(inquiry.id, reservationId, status);
            if (isMounted.current) {
                setReservations((prev) => new Map(prev).set(assignmentId, { id: reservationId, status }));
            }
        } catch (err) {
            console.error('Failed to update equipment reservation status', err);
        } finally {
            if (isMounted.current) setReserving((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id]);

    const handleDirectConfirmCrew = useCallback(async (crewId: number, row: InquiryCrewAvailabilityRow) => {
        setSending((prev) => new Set(prev).add(crewId));
        try {
            // Send request silently then immediately confirm it
            const created = await inquiriesApi.sendAvailabilityRequest(inquiry.id, {
                crew_id: crewId,
                project_crew_slot_id: row.id,
            });
            const confirmed = await inquiriesApi.updateAvailabilityRequest(inquiry.id, created.id, 'confirmed');
            if (isMounted.current) {
                setRequests((prev) => new Map(prev).set(crewId, { id: confirmed.id, status: 'confirmed' }));
            }
        } catch (err) {
            console.error('Failed to directly confirm crew', err);
        } finally {
            if (isMounted.current) setSending((prev) => { const s = new Set(prev); s.delete(crewId); return s; });
        }
    }, [inquiry.id]);

    const [swappingSlots, setSwappingSlots] = useState<Set<number>>(new Set());
    const [swappingEquipment, setSwappingEquipment] = useState<Set<number>>(new Set());

    const handleSwapCrew = useCallback(async (slotId: number, newCrewId: number) => {
        setSwappingSlots((prev) => new Set(prev).add(slotId));
        try {
            await crewSlotsApi.projectDay.assign(slotId, newCrewId);
            await refreshAvailability();
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to reassign crew', err);
        } finally {
            if (isMounted.current) setSwappingSlots((prev) => { const s = new Set(prev); s.delete(slotId); return s; });
        }
    }, [refreshAvailability, onTasksChanged]);

    const handleSwapEquipment = useCallback(async (assignmentId: number, newEquipmentId: number) => {
        setSwappingEquipment((prev) => new Set(prev).add(assignmentId));
        try {
            await inquiriesApi.swapEquipment(inquiry.id, assignmentId, newEquipmentId);
            await refreshAvailability();
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to swap equipment', err);
        } finally {
            if (isMounted.current) setSwappingEquipment((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
        }
    }, [inquiry.id, refreshAvailability, onTasksChanged]);

    const handleCancelOwnerReservations = useCallback(async (ownerRows: InquiryEquipmentAvailabilityRow[]) => {
        for (const row of ownerRows) {
            const state = reservations.get(row.id);
            if (state && (state.status === 'reserved' || state.status === 'confirmed')) {
                await handleUpdateEquipmentStatus(row.id, state.id, 'cancelled');
            }
        }
    }, [handleUpdateEquipmentStatus, reservations]);

    const handleConfirmOwnerReservations = useCallback(async (ownerRows: InquiryEquipmentAvailabilityRow[]) => {
        for (const row of ownerRows) {
            const state = reservations.get(row.id);
            if (state?.status === 'reserved') {
                await handleUpdateEquipmentStatus(row.id, state.id, 'confirmed');
            }
        }
    }, [handleUpdateEquipmentStatus, reservations]);

    const handleDirectConfirmEquipment = useCallback(async (ownerRows: InquiryEquipmentAvailabilityRow[]) => {
        // Reserve all equipment for this owner then immediately confirm each
        for (const row of ownerRows) {
            setReserving((prev) => new Set(prev).add(row.id));
        }
        try {
            for (const row of ownerRows) {
                const result = await inquiriesApi.reserveEquipment(inquiry.id, row.id);
                await inquiriesApi.updateEquipmentReservation(inquiry.id, result.id, 'confirmed');
                if (isMounted.current) {
                    setReservations((prev) => new Map(prev).set(row.id, { id: result.id, status: 'confirmed' }));
                }
            }
            onTasksChanged?.();
        } catch (err) {
            console.error('Failed to directly confirm equipment', err);
        } finally {
            if (isMounted.current) {
                setReserving((prev) => {
                    const s = new Set(prev);
                    for (const row of ownerRows) s.delete(row.id);
                    return s;
                });
            }
        }
    }, [inquiry.id, onTasksChanged]);

    // Group ALL crew rows by crew (merged view — one card per person)
    type MergedCrewGroup = {
        cid: number;
        name: string;
        onSiteRows: InquiryCrewAvailabilityRow[]; // keyed by day
        projectRows: InquiryCrewAvailabilityRow[];
    };
    const mergedCrewGroups: MergedCrewGroup[] = [];
    const unassignedRows: InquiryCrewAvailabilityRow[] = [];
    const seenCrewMerged = new Map<number, number>(); // cid → index

    for (const row of (crew?.rows ?? [])) {
        const cid = row.assigned_crew?.id;
        if (cid == null) {
            unassignedRows.push(row);
            continue;
        }
        if (!seenCrewMerged.has(cid)) {
            seenCrewMerged.set(cid, mergedCrewGroups.length);
            mergedCrewGroups.push({ cid, name: row.assigned_crew!.name, onSiteRows: [], projectRows: [] });
        }
        const group = mergedCrewGroups[seenCrewMerged.get(cid)!];
        if (row.is_on_site && row.event_day?.date) {
            group.onSiteRows.push(row);
        } else {
            group.projectRows.push(row);
        }
    }

    // Readiness counts for StatusBanner
    const uniqueCrewCount = new Set((crew?.rows ?? []).map(r => r.assigned_crew?.id).filter(Boolean)).size;
    const crewReadyCount = Array.from(requests.values()).filter(r => r.status === 'confirmed').length;
    const equipmentReadyCount = Array.from(reservations.values()).filter(r => r.status === 'reserved' || r.status === 'confirmed').length;

    const getCrewRows = useCallback((crewId: number) => {
        const allRows = crew?.rows ?? [];
        return allRows.filter((row) => row.assigned_crew?.id === crewId);
    }, [crew?.rows]);

    const openCrewRequestDialog = useCallback(async (row: InquiryCrewAvailabilityRow) => {
        if (!row.assigned_crew) {
            return;
        }
        const crewId = row.assigned_crew.id;
        const crewName = row.assigned_crew.name;
        const crewRows = getCrewRows(crewId);

        // Fetch production tasks for the linked package so the email shows
        // a full before/on-day/after breakdown with hours and costs.
        let previewTasks: TaskAutoGenerationPreviewTask[] | undefined;
        const packageId = inquiry.selected_package_id;
        if (packageId && brandId) {
            try {
                const preview = await taskLibraryApi.previewAutoGeneration(packageId, brandId, inquiry.id);
                previewTasks = preview.tasks;
            } catch {
                // non-fatal — email falls back to simple role list
            }
        }

        const draft = buildCrewEmailDraft(inquiry, crewName, crewRows, previewTasks, currentBrand, crewPaymentTemplates);
        setCrewDialogError(null);
        setCrewDialogState({
            crewId,
            crewName,
            crewEmail: row.assigned_crew.email,
            rows: crewRows,
            requestState: requests.get(crewId),
            emailSubject: draft.subject,
            emailBody: draft.body,
            previewTasks,
            eventDate: inquiry.event_date ?? null,
            venueDetails: inquiry.venue_details ?? inquiry.venue_address ?? null,
            eventType: inquiry.event_type ?? null,
            clientName: inquiry.contact?.full_name ?? inquiry.contact?.first_name,
            brandName: currentBrand?.display_name ?? currentBrand?.name,
        });
    }, [getCrewRows, inquiry, requests, brandId, currentBrand]);

    const openEquipmentDialog = useCallback((row: InquiryEquipmentAvailabilityRow) => {
        // Get all equipment for this owner
        const ownerId = row.equipment.owner?.id;
        if (ownerId === undefined) return;
        
        const ownerRows = (equipment?.rows ?? []).filter((r) => r.equipment.owner?.id === ownerId);
        const ownerName = row.equipment.owner?.name ?? 'Equipment Owner';
        const ownerEmail = row.equipment.owner?.email;
        
        const draft = buildEquipmentEmailDraft(inquiry, ownerName, ownerRows, currentBrand);
        setEquipmentDialogError(null);
        
        const reservationStates = new Map<number, ReservationState>();
        for (const r of ownerRows) {
            const state = reservations.get(r.id);
            if (state) {
                reservationStates.set(r.id, state);
            }
        }
        
        setEquipmentDialogState({
            ownerId,
            ownerName,
            ownerEmail,
            rows: ownerRows,
            reservationStates,
            emailSubject: draft.subject,
            emailBody: draft.body,
        });
    }, [inquiry, equipment?.rows, reservations, currentBrand]);

    const confirmCrewRequest = useCallback(async () => {
        if (!crewDialogState) {
            return;
        }
        const firstRow = crewDialogState.rows[0];
        if (!firstRow) {
            return;
        }

        try {
            await handleSendRequest(firstRow);
            if (crewDialogState.crewEmail) {
                const mailto = `mailto:${encodeURIComponent(crewDialogState.crewEmail)}?subject=${encodeURIComponent(crewDialogState.emailSubject)}&body=${encodeURIComponent(crewDialogState.emailBody)}`;
                window.location.href = mailto;
            }
            setCrewDialogState(null);
        } catch (err) {
            setCrewDialogError(err instanceof Error ? err.message : 'Unable to send availability request');
        }
    }, [crewDialogState, handleSendRequest]);

    const confirmEquipmentReservation = useCallback(async () => {
        if (!equipmentDialogState) {
            return;
        }

        try {
            // Reserve all equipment for this owner
            for (const row of equipmentDialogState.rows) {
                await handleReserveEquipment(row);
            }
            if (equipmentDialogState.ownerEmail) {
                const mailto = `mailto:${encodeURIComponent(equipmentDialogState.ownerEmail)}?subject=${encodeURIComponent(equipmentDialogState.emailSubject)}&body=${encodeURIComponent(equipmentDialogState.emailBody)}`;
                window.location.href = mailto;
            }
            setEquipmentDialogState(null);
        } catch (err) {
            setEquipmentDialogError(err instanceof Error ? err.message : 'Unable to reserve equipment');
        }
    }, [equipmentDialogState, handleReserveEquipment]);

    const confirmCancelReservation = useCallback(async () => {
        if (!equipmentDialogState) {
            return;
        }

        try {
            // Cancel all reservations for this owner
            for (const row of equipmentDialogState.rows) {
                const state = equipmentDialogState.reservationStates.get(row.id);
                if (state) {
                    await handleCancelReservation(row);
                }
            }
            setEquipmentDialogState(null);
        } catch (err) {
            setEquipmentDialogError(err instanceof Error ? err.message : 'Unable to cancel reservation');
        }
    }, [equipmentDialogState, handleCancelReservation]);

    const setCrewEmailSubject = useCallback((v: string) => {
        setCrewDialogState((prev) => prev ? { ...prev, emailSubject: v } : null);
    }, []);
    const setCrewEmailBody = useCallback((v: string) => {
        setCrewDialogState((prev) => prev ? { ...prev, emailBody: v } : null);
    }, []);
    const setEquipmentEmailSubject = useCallback((v: string) => {
        setEquipmentDialogState((prev) => prev ? { ...prev, emailSubject: v } : null);
    }, []);
    const setEquipmentEmailBody = useCallback((v: string) => {
        setEquipmentDialogState((prev) => prev ? { ...prev, emailBody: v } : null);
    }, []);

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent sx={{ p: '0 !important' }}>
                <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.25, borderBottom: '1px solid rgba(52,58,68,0.3)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent)' }}>
                    <CheckCircle sx={{ color: '#60a5fa', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                        Availability
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} sx={{ color: '#64748b' }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Checking on-site crew and assigned gear…
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2.5 }}>
                        <Alert severity="warning">{error}</Alert>
                    </Box>
                ) : (
                    <Box sx={{ p: 2.5 }}>
                        <StatusBanner
                            crewConflicts={crew?.summary.conflicts ?? 0}
                            equipmentConflicts={equipment?.summary.conflicts ?? 0}
                            crewTotal={uniqueCrewCount}
                            equipmentTotal={equipment?.summary.total ?? 0}
                            crewReady={crewReadyCount}
                            equipmentReady={equipmentReadyCount}
                        />

                        {/* ─── Crew (merged: on-site + project roles per person) ─── */}
                        {mergedCrewGroups.length > 0 && (
                            <Stack spacing={0.8}>
                                {mergedCrewGroups.map(({ cid, name, onSiteRows, projectRows }) => {
                                    const allRows = [...onSiteRows, ...projectRows];
                                    const totalRoles = allRows.length;
                                    const reqState = requests.get(cid);

                                    // Sub-group on-site rows by event day
                                    const onSiteByDay = new Map<string, InquiryCrewAvailabilityRow[]>();
                                    for (const r of onSiteRows) {
                                        const key = r.event_day!.date.slice(0, 10);
                                        if (!onSiteByDay.has(key)) onSiteByDay.set(key, []);
                                        onSiteByDay.get(key)!.push(r);
                                    }

                                    return (
                                        <Box key={cid} sx={{ p: 1.1, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.26)', border: '1px solid rgba(52,58,68,0.35)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.8 }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                                        {name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.67rem', color: '#475569' }}>
                                                        {totalRoles} role{totalRoles !== 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                                <RequestBadge
                                                    requestState={reqState}
                                                    onSend={() => openCrewRequestDialog(allRows[0])}
                                                    onUpdateStatus={(status) => {
                                                        if (reqState) handleUpdateStatus(cid, reqState.id, status);
                                                    }}
                                                    onDirectConfirm={() => handleDirectConfirmCrew(cid, allRows[0])}
                                                    sending={sending.has(cid)}
                                                />
                                            </Box>

                                            {/* On-site roles */}
                                            {onSiteRows.length > 0 && (
                                                <Box sx={{ mb: projectRows.length > 0 ? 0.8 : 0 }}>
                                                    {Array.from(onSiteByDay.entries()).map(([dateKey, dayRows]) => (
                                                        <Box key={dateKey} sx={{ mb: 0.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4, pl: 0.25 }}>
                                                                <Tooltip title="On-site" arrow placement="top">
                                                                    <Videocam sx={{ fontSize: 13, color: '#60a5fa' }} />
                                                                </Tooltip>
                                                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 600, color: '#60a5fa' }}>
                                                                    {formatDayHeader(dayRows[0].event_day!.date, dayRows[0].event_day!.start_time, dayRows[0].event_day!.end_time)}
                                                                </Typography>
                                                            </Box>
                                                            <Stack spacing={0.5}>
                                                                {dayRows.map((row) => <CrewRow key={row.id} row={row} onSwap={handleSwapCrew} swapping={swappingSlots.has(row.id)} />)}
                                                            </Stack>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}

                                            {/* Project roles */}
                                            {projectRows.length > 0 && (
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4, pl: 0.25 }}>
                                                        <Tooltip title="Project role" arrow placement="top">
                                                            <WorkOutline sx={{ fontSize: 13, color: '#a78bfa' }} />
                                                        </Tooltip>
                                                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 600, color: '#a78bfa' }}>
                                                            Project Roles
                                                        </Typography>
                                                    </Box>
                                                    <Stack spacing={0.5}>
                                                        {projectRows.map((row) => <CrewRow key={row.id} row={row} onSwap={handleSwapCrew} swapping={swappingSlots.has(row.id)} />)}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                                {unassignedRows.map((row) => <CrewRow key={row.id} row={row} onSwap={handleSwapCrew} swapping={swappingSlots.has(row.id)} />)}
                            </Stack>
                        )}

                        {(crew?.rows ?? []).length === 0 && (
                            <Alert severity="info">No crew roles are assigned yet.</Alert>
                        )}

                        <Divider sx={{ my: 2, borderColor: 'rgba(52,58,68,0.3)' }} />

                        {/* ─── Equipment ─── */}
                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.9 }}>
                            Equipment Availability
                        </Typography>
                        <Stack spacing={0.8}>
                            {(equipment?.rows ?? []).length === 0 ? (
                                <Alert severity="info">No assigned equipment needs review yet.</Alert>
                            ) : (() => {
                                // Group equipment by owner
                                const equipmentByOwner = new Map<number | null, InquiryEquipmentAvailabilityRow[]>();
                                for (const row of (equipment?.rows ?? [])) {
                                    const ownerId = row.equipment.owner?.id ?? null;
                                    if (!equipmentByOwner.has(ownerId)) {
                                        equipmentByOwner.set(ownerId, []);
                                    }
                                    equipmentByOwner.get(ownerId)!.push(row);
                                }

                                // Render each owner's equipment as a group
                                return Array.from(equipmentByOwner.entries()).map(([ownerId, ownerRows]) => {
                                    const firstRow = ownerRows[0];
                                    const ownerName = firstRow.equipment.owner?.name ?? 'Equipment Owner';
                                    const owner = firstRow.equipment.owner;
                                    const ownerReserving = ownerRows.some((row) => reserving.has(row.id));
                                    const ownerStatuses = ownerRows.map((row) => reservations.get(row.id)?.status);
                                    const ownerAllActive = ownerRows.length > 0 && ownerStatuses.every((s) => s === 'reserved' || s === 'confirmed');
                                    const ownerAllConfirmed = ownerAllActive && ownerStatuses.every((s) => s === 'confirmed');
                                    const ownerReservationState: ReservationState | undefined = ownerAllActive
                                        ? { id: ownerId ?? -1, status: ownerAllConfirmed ? 'confirmed' : 'reserved' }
                                        : undefined;

                                    return (
                                        <Box key={ownerId ?? 'unowned'} sx={{ mb: 1, p: 1.1, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.26)', border: '1px solid rgba(52,58,68,0.35)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.8 }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                                        {ownerName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.67rem', color: '#475569' }}>
                                                        {ownerRows.length} item{ownerRows.length !== 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                                <ReserveBadge
                                                    reservationState={ownerReservationState}
                                                    onReserve={() => openEquipmentDialog(firstRow)}
                                                    onUpdateStatus={(status) => {
                                                        if (status === 'confirmed') void handleConfirmOwnerReservations(ownerRows);
                                                        else void handleCancelOwnerReservations(ownerRows);
                                                    }}
                                                    onDirectConfirm={() => handleDirectConfirmEquipment(ownerRows)}
                                                    reserving={ownerReserving}
                                                    owner={owner}
                                                />
                                            </Box>
                                            <Stack spacing={0.8}>
                                                {ownerRows.map((row) => (
                                                    <EquipmentRow
                                                        key={row.id}
                                                        row={row}
                                                        reservationState={reservations.get(row.id)}
                                                        onSwap={handleSwapEquipment}
                                                        swapping={swappingEquipment.has(row.id)}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    );
                                });
                            })()}
                        </Stack>
                    </Box>
                )}
            </CardContent>

            <CrewAvailabilityRequestDialog
                open={Boolean(crewDialogState)}
                onClose={() => setCrewDialogState(null)}
                crewName={crewDialogState?.crewName ?? ''}
                crewEmail={crewDialogState?.crewEmail}
                rows={crewDialogState?.rows ?? []}
                requestStatus={crewDialogState?.requestState?.status ?? null}
                emailSubject={crewDialogState?.emailSubject ?? ''}
                emailBody={crewDialogState?.emailBody ?? ''}
                onEmailSubjectChange={setCrewEmailSubject}
                onEmailBodyChange={setCrewEmailBody}
                onConfirm={confirmCrewRequest}
                loading={crewDialogState ? sending.has(crewDialogState.crewId) : false}
                error={crewDialogError}
                previewTasks={crewDialogState?.previewTasks}
                eventDate={crewDialogState?.eventDate}
                venueDetails={crewDialogState?.venueDetails}
                eventType={crewDialogState?.eventType}
                clientName={crewDialogState?.clientName}
                brandName={crewDialogState?.brandName}
            />

            <EquipmentReservationDialog
                open={Boolean(equipmentDialogState)}
                onClose={() => setEquipmentDialogState(null)}
                rows={equipmentDialogState?.rows ?? []}
                ownerName={equipmentDialogState?.ownerName ?? ''}
                reservationStatuses={equipmentDialogState?.reservationStates ?? new Map()}
                emailSubject={equipmentDialogState?.emailSubject ?? ''}
                emailBody={equipmentDialogState?.emailBody ?? ''}
                onEmailSubjectChange={setEquipmentEmailSubject}
                onEmailBodyChange={setEquipmentEmailBody}
                onConfirm={confirmEquipmentReservation}
                onCancelReservation={equipmentDialogState && Array.from(equipmentDialogState.reservationStates.values()).every((s) => s.status === 'reserved') ? confirmCancelReservation : undefined}
                loading={equipmentDialogState ? Array.from(equipmentDialogState.rows).some((row) => reserving.has(row.id)) : false}
                error={equipmentDialogError}
            />
        </WorkflowCard>
    );
};

export default AvailabilityCard;
