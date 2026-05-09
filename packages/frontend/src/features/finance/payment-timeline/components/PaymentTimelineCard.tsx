'use client';

import React, { useState, useCallback } from 'react';
import {
    Box, Typography, CardContent, Stack, Chip, Button, LinearProgress,
    Dialog, DialogTitle, DialogContent, IconButton, Select, MenuItem,
    FormControl, InputLabel, Collapse, Divider, CircularProgress, Tooltip,
} from '@mui/material';
import {
    Receipt, CheckCircle, Schedule, Warning, Send, DeleteOutline,
    PublishedWithChanges, OpenInNew, Payment, Email, Undo,
    ExpandMore, ExpandLess, Close, Timeline,
} from '@mui/icons-material';
import { useInquiryInvoices, useInvoiceMutations } from '@/features/finance/invoices/hooks';
import { usePaymentScheduleTemplates } from '@/features/finance/payment-schedules';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { paymentSchedulesApi } from '@/features/finance/payment-schedules';
import { clientPortalApi } from '@/features/workflow/client-portal/api';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY, formatCurrency } from '@projectflo/shared';
import { roundMoney } from '@/shared/utils/pricing';
import type { Invoice } from '@/features/finance/invoices/types';
import type { Estimate } from '@/features/finance/estimates/types';
import type { Quote } from '@/features/finance/quotes/types';
import type { WorkflowCardProps } from '@/features/workflow/inquiries/lib/types';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import InvoiceDetailView from '@/features/finance/invoices/components/InvoiceDetailView';
import RecordPaymentDialog from '@/features/finance/invoices/components/RecordPaymentDialog';

/* ── Status config ── */
const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
    Draft: { color: '#64748b', icon: <Schedule sx={{ fontSize: 12 }} /> },
    Sent: { color: '#3b82f6', icon: <Send sx={{ fontSize: 12 }} /> },
    Paid: { color: '#22c55e', icon: <CheckCircle sx={{ fontSize: 12 }} /> },
    Overdue: { color: '#ef4444', icon: <Warning sx={{ fontSize: 12 }} /> },
    'Partially Paid': { color: '#f59e0b', icon: <Schedule sx={{ fontSize: 12 }} /> },
};

function getStatusConfig(status: string) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

const PaymentTimelineCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { currentBrand } = useBrand();
    const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;
    const { invoices } = useInquiryInvoices(inquiry.id);
    const { updateInvoice, deleteInvoice, regenerateInvoices, recordPayment, voidPayment } = useInvoiceMutations(inquiry.id);
    const { data: templates = [], isLoading: templatesLoading } = usePaymentScheduleTemplates();

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
    const [recordingInvoice, setRecordingInvoice] = useState<Invoice | null>(null);
    const [saving, setSaving] = useState(false);

    const [selectedId, setSelectedId] = useState<number | null>(
        inquiry.preferred_payment_schedule_template_id ?? null
    );

    React.useEffect(() => {
        const prefId = inquiry.preferred_payment_schedule_template_id ?? null;
        if (prefId !== null) {
            setSelectedId(prefId);
        } else if (templates.length > 0 && selectedId === null) {
            const def = templates.find((t) => t.is_default);
            if (def) setSelectedId(def.id);
        }
    }, [inquiry.preferred_payment_schedule_template_id, templates]);

    /* ── Computed totals ── */
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid ?? 0), 0);
    const totalOutstanding = totalAmount - totalPaid;
    const progressPercent = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
    const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
    const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

    /* ── Template change handler ── */
    const handleTemplateChange = useCallback(async (newId: number) => {
        if (newId === selectedId) return;
        setSelectedId(newId);
        setSaving(true);
        try {
            const template = templates.find((t) => t.id === newId);
            if (!template) return;
            const bookingDate = new Date().toISOString().split('T')[0];
            const eventDate = inquiry.event_date
                ? new Date(inquiry.event_date).toISOString().split('T')[0]
                : bookingDate;

            await inquiriesApi.update(inquiry.id, { preferred_payment_schedule_template_id: newId });

            const allEstimates: Estimate[] = inquiry.estimates ?? [];
            const allQuotes: Quote[] = inquiry.quotes ?? [];
            await Promise.all([
                ...allEstimates.map((e) =>
                    paymentSchedulesApi.applyToEstimate(e.id, {
                        template_id: Number(template.id), booking_date: bookingDate,
                        event_date: eventDate, total_amount: Number(e.total_amount) || 0,
                    })
                ),
                ...allQuotes.map((q) =>
                    paymentSchedulesApi.applyToQuote(q.id, {
                        template_id: Number(template.id), booking_date: bookingDate,
                        event_date: eventDate, total_amount: Number(q.total_amount) || 0,
                    })
                ),
            ]);
            await onRefresh?.();
        } catch {
            // silently fail
        } finally {
            setSaving(false);
        }
    }, [selectedId, templates, inquiry.event_date, inquiry.id, inquiry.estimates, inquiry.quotes, onRefresh]);

    /* ── Handlers ── */
    const handlePreviewPayments = async () => {
        try {
            const { portal_token } = await clientPortalApi.generateToken(inquiry.id);
            window.open(`/portal/${portal_token}/payments?preview=true`, '_blank');
        } catch (err) {
            console.error('Failed to generate portal token:', err);
        }
    };

    const handlePublishToPortal = async (invoiceId: number) => {
        try {
            await updateInvoice.mutateAsync({ invoiceId, data: { status: 'Sent' as never } });
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Failed to publish invoice:', err);
        }
    };

    const handleSendReceipt = async (invoice: Invoice) => {
        try {
            const payments = [...(invoice.payments ?? [])];
            if (!payments.length) { window.alert('No payments recorded yet.'); return; }
            const latestPayment = payments.sort((a, b) => {
                const aTime = a.payment_date ? new Date(a.payment_date).getTime() : 0;
                const bTime = b.payment_date ? new Date(b.payment_date).getTime() : 0;
                return bTime - aTime;
            })[0];

            let receiptLink = latestPayment.receipt_url || '';
            if (!receiptLink) {
                const { portal_token } = await clientPortalApi.generateToken(inquiry.id);
                receiptLink = `${window.location.origin}/portal/${portal_token}/payments`;
            }
            const recipient = invoice.inquiry?.contact?.email ?? '';
            const amount = formatCurrency(Number(latestPayment.amount), currency);
            const paymentDate = latestPayment.payment_date
                ? new Date(latestPayment.payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'recently';
            const method = latestPayment.payment_method || 'Bank Transfer';
            const subject = `Receipt for ${invoice.invoice_number}`;
            const body = `Hi,\n\nThanks for your payment of ${amount} for invoice ${invoice.invoice_number}.\nPayment method: ${method}\nPayment date: ${paymentDate}\n\nView receipt/payment details: ${receiptLink}\n\nThank you.`;
            window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            await navigator.clipboard.writeText(body);
        } catch (err) {
            console.error('Failed to prepare receipt email:', err);
        }
    };

    const activeTemplate = templates.find((t) => t.id === selectedId) ?? null;
    const hasInvoices = invoices.length > 0;

    return (
        <>
            {/* Invoice Detail Dialog */}
            <Dialog open={!!viewingInvoice} onClose={() => setViewingInvoice(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { bgcolor: '#0a0f1e', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 3, maxHeight: '90vh' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
                    <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>
                        Invoice {viewingInvoice?.invoice_number}
                    </Typography>
                    <IconButton onClick={() => setViewingInvoice(null)} size="small" sx={{ color: '#64748b' }}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {viewingInvoice && <InvoiceDetailView invoice={viewingInvoice} currency={currency} />}
                </DialogContent>
            </Dialog>

            {/* Record Payment Dialog */}
            {recordingInvoice && (
                <RecordPaymentDialog
                    open onClose={() => setRecordingInvoice(null)}
                    invoice={recordingInvoice} currency={currency} isPending={recordPayment.isPending}
                    onSubmit={async (data) => {
                        await recordPayment.mutateAsync({ invoiceId: recordingInvoice.id, data });
                        setRecordingInvoice(null);
                        if (onRefresh) await onRefresh();
                    }}
                />
            )}

            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    {/* ── Header ── */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 2,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.15)',
                            }}>
                                <Timeline sx={{ fontSize: 18, color: '#ec4899' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>
                                Payment Timeline
                            </Typography>
                            {saving && <CircularProgress size={14} sx={{ color: '#ec4899' }} />}
                        </Box>
                        {hasInvoices && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" startIcon={<PublishedWithChanges sx={{ fontSize: 14 }} />}
                                    onClick={() => regenerateInvoices.mutate()} disabled={regenerateInvoices.isPending}
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.68rem', color: '#94a3b8', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.15)', px: 1.5, py: 0.5, '&:hover': { color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)', bgcolor: 'rgba(245,158,11,0.06)' } }}>
                                    {regenerateInvoices.isPending ? 'Regenerating…' : 'Regenerate'}
                                </Button>
                                <Button size="small" startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                    onClick={handlePreviewPayments}
                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.68rem', color: '#94a3b8', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.15)', px: 1.5, py: 0.5, '&:hover': { color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)', bgcolor: 'rgba(236,72,153,0.06)' } }}>
                                    Preview Portal
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* ── Payment schedule template selector (compact) ── */}
                    {!templatesLoading && templates.length > 0 && (
                        <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={saving}>
                            <InputLabel id="payment-timeline-template-label" sx={{ fontSize: '0.78rem' }}>Payment Schedule</InputLabel>
                            <Select
                                labelId="payment-timeline-template-label"
                                value={selectedId ?? ''}
                                label="Payment Schedule"
                                onChange={(e) => handleTemplateChange(Number(e.target.value))}
                                sx={{ '& .MuiSelect-select': { py: 1 } }}
                            >
                                {templates.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>{t.name}</span>
                                            {t.is_default && <Chip label="Default" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />}
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {!hasInvoices ? (
                        /* ── Empty state ── */
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.12)' }}>
                                <Receipt sx={{ fontSize: 22, color: '#ec4899' }} />
                            </Box>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No invoices yet</Typography>
                            <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>
                                Invoices will auto-generate when you create a proposal
                            </Typography>

                            {/* Show schedule preview when no invoices but template is active */}
                            {activeTemplate && activeTemplate.rules.length > 0 && (() => {
                                const allEstimates: Estimate[] = inquiry.estimates ?? [];
                                const grandTotal = allEstimates.reduce((s, e) => s + (Number(e.total_amount) || 0), 0);
                                const hasPricing = grandTotal > 0;
                                const sorted = activeTemplate.rules.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

                                return (
                                    <Box sx={{ mt: 2, textAlign: 'left', p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                                            Schedule Preview
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            {sorted.map((rule, i) => {
                                                const pct = rule.amount_type === 'PERCENT' ? Number(rule.amount_value) : 0;
                                                const amount = hasPricing
                                                    ? (rule.amount_type === 'PERCENT' ? roundMoney((pct / 100) * grandTotal) : Number(rule.amount_value))
                                                    : 0;
                                                const trigger = rule.trigger_type === 'AFTER_BOOKING' ? `${rule.trigger_days ?? 0}d after booking`
                                                    : rule.trigger_type === 'BEFORE_EVENT' ? `${rule.trigger_days ?? 0}d before event`
                                                    : rule.trigger_type === 'AFTER_EVENT' ? `${rule.trigger_days ?? 0}d after event` : 'On date';
                                                return (
                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#64748b', flexShrink: 0 }} />
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1', flex: 1 }}>{rule.label}</Typography>
                                                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b' }}>{trigger}</Typography>
                                                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'monospace', minWidth: 50, textAlign: 'right' }}>
                                                            {hasPricing ? formatCurrency(amount, currency) : `${rule.amount_value}%`}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                );
                            })()}
                        </Box>
                    ) : (
                        <>
                            {/* ── Progress bar ── */}
                            <Box sx={{ mb: 2, px: 0.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                                        {formatCurrency(totalPaid, currency)} / {formatCurrency(totalAmount, currency)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.68rem', color: progressPercent === 100 ? '#22c55e' : '#94a3b8', fontWeight: 700 }}>
                                        {progressPercent}%
                                        {paidCount > 0 && ` · ${paidCount} of ${invoices.length} paid`}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPercent}
                                    sx={{
                                        height: 6, borderRadius: 3,
                                        bgcolor: 'rgba(148,163,184,0.08)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            background: overdueCount > 0
                                                ? 'linear-gradient(90deg, #22c55e, #ef4444)'
                                                : progressPercent === 100
                                                    ? '#22c55e'
                                                    : 'linear-gradient(90deg, #ec4899, #a855f7)',
                                        },
                                    }}
                                />
                                {overdueCount > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        <Warning sx={{ fontSize: 12, color: '#ef4444' }} />
                                        <Typography sx={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 600 }}>
                                            {formatCurrency(totalOutstanding, currency)} outstanding · {overdueCount} overdue
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* ── Milestone timeline ── */}
                            <Stack spacing={0.75}>
                                {invoices.map((invoice, idx) => {
                                    const config = getStatusConfig(invoice.status);
                                    const isExpanded = expandedId === invoice.id;
                                    const balance = Number(invoice.amount) - Number(invoice.amount_paid ?? 0);
                                    const milestoneLabel = invoice.milestone?.label || invoice.title || invoice.invoice_number;
                                    const isLast = idx === invoices.length - 1;

                                    return (
                                        <Box key={invoice.id}>
                                            {/* Milestone row */}
                                            <Box
                                                onClick={() => setExpandedId(isExpanded ? null : invoice.id)}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1,
                                                    px: 1.5, py: 1, borderRadius: '10px', cursor: 'pointer',
                                                    bgcolor: 'rgba(15,23,42,0.6)',
                                                    border: `1px solid ${isExpanded ? 'rgba(236,72,153,0.25)' : 'rgba(148,163,184,0.08)'}`,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { borderColor: 'rgba(236,72,153,0.2)', bgcolor: 'rgba(15,23,42,0.8)' },
                                                }}
                                            >
                                                {/* Timeline dot + line */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', py: 0.25 }}>
                                                    <Box sx={{
                                                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                                        bgcolor: invoice.status === 'Paid' ? '#22c55e'
                                                            : invoice.status === 'Overdue' ? '#ef4444'
                                                            : invoice.status === 'Sent' ? '#3b82f6' : '#334155',
                                                        border: `2px solid ${invoice.status === 'Paid' ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.15)'}`,
                                                    }} />
                                                    {!isLast && (
                                                        <Box sx={{ width: 2, flex: 1, bgcolor: 'rgba(148,163,184,0.1)', mt: 0.25, borderRadius: 1 }} />
                                                    )}
                                                </Box>

                                                {/* Info */}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {milestoneLabel}
                                                        </Typography>
                                                        <Chip
                                                            icon={config.icon as React.ReactElement}
                                                            label={invoice.status}
                                                            size="small"
                                                            sx={{
                                                                height: 18, fontSize: '0.55rem', fontWeight: 700,
                                                                bgcolor: `${config.color}15`, color: config.color,
                                                                '& .MuiChip-icon': { color: config.color, ml: 0.5 },
                                                                '& .MuiChip-label': { px: 0.5 },
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography sx={{ color: '#64748b', fontSize: '0.62rem', mt: 0.15 }}>
                                                        {invoice.invoice_number} · Due {formatDate(invoice.due_date)}
                                                    </Typography>
                                                </Box>

                                                {/* Amount */}
                                                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        {formatCurrency(invoice.amount, currency)}
                                                    </Typography>
                                                    {Number(invoice.amount_paid ?? 0) > 0 && invoice.status !== 'Paid' && (
                                                        <Typography sx={{ color: '#22c55e', fontSize: '0.58rem', fontWeight: 600 }}>
                                                            {formatCurrency(Number(invoice.amount_paid), currency)} paid
                                                        </Typography>
                                                    )}
                                                </Box>
                                                {isExpanded ? <ExpandLess sx={{ fontSize: 16, color: '#64748b' }} /> : <ExpandMore sx={{ fontSize: 16, color: '#64748b' }} />}
                                            </Box>

                                            {/* Expanded detail */}
                                            <Collapse in={isExpanded}>
                                                <Box sx={{ mt: 0.5, ml: 3.5, px: 2, py: 1.5, borderRadius: '10px', bgcolor: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.06)' }}>
                                                    {/* Items */}
                                                    {invoice.items.length > 0 && (
                                                        <Box sx={{ mb: 1.5 }}>
                                                            <Typography sx={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.75 }}>
                                                                Line Items
                                                            </Typography>
                                                            {invoice.items.map((item, i) => (
                                                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                                                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.75rem' }}>{item.description}</Typography>
                                                                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                        {formatCurrency(Number(item.quantity) * Number(item.unit_price), currency)}
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    )}
                                                    <Divider sx={{ borderColor: 'rgba(148,163,184,0.08)', my: 1 }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>Balance Due</Typography>
                                                        <Typography sx={{ color: balance > 0 ? '#f59e0b' : '#22c55e', fontSize: '0.82rem', fontWeight: 700 }}>
                                                            {formatCurrency(balance, currency)}
                                                        </Typography>
                                                    </Box>
                                                    {/* Actions */}
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        {invoice.status === 'Draft' && (
                                                            <Button size="small" startIcon={<Send sx={{ fontSize: 14 }} />}
                                                                onClick={(e) => { e.stopPropagation(); handlePublishToPortal(invoice.id); }}
                                                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: '#3b82f6', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', '&:hover': { bgcolor: 'rgba(59,130,246,0.08)' } }}>
                                                                Publish
                                                            </Button>
                                                        )}
                                                        <Button size="small"
                                                            onClick={(e) => { e.stopPropagation(); setViewingInvoice(invoice); }}
                                                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: '#ec4899', borderRadius: '8px', border: '1px solid rgba(236,72,153,0.3)', '&:hover': { bgcolor: 'rgba(236,72,153,0.08)' } }}>
                                                            View
                                                        </Button>
                                                        {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
                                                            <Button size="small" startIcon={<Payment sx={{ fontSize: 14 }} />}
                                                                onClick={(e) => { e.stopPropagation(); setRecordingInvoice(invoice); }}
                                                                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: '#22c55e', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.3)', '&:hover': { bgcolor: 'rgba(34,197,94,0.08)' } }}>
                                                                Record Payment
                                                            </Button>
                                                        )}
                                                        {invoice.payments && invoice.payments.length > 0 && (
                                                            <>
                                                                <Button size="small" startIcon={<Email sx={{ fontSize: 14 }} />}
                                                                    onClick={(e) => { e.stopPropagation(); void handleSendReceipt(invoice); }}
                                                                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: '#a78bfa', borderRadius: '8px', border: '1px solid rgba(167,139,250,0.3)', '&:hover': { bgcolor: 'rgba(167,139,250,0.08)' } }}>
                                                                    Receipt
                                                                </Button>
                                                                <Tooltip title="Undo last payment" placement="top">
                                                                    <Button size="small" startIcon={<Undo sx={{ fontSize: 14 }} />}
                                                                        disabled={voidPayment.isPending}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const sorted = [...invoice.payments!].sort((a, b) => {
                                                                                const aT = a.payment_date ? new Date(a.payment_date).getTime() : 0;
                                                                                const bT = b.payment_date ? new Date(b.payment_date).getTime() : 0;
                                                                                return bT - aT;
                                                                            });
                                                                            const latest = sorted[0];
                                                                            if (!latest) return;
                                                                            const amount = formatCurrency(Number(latest.amount), currency);
                                                                            if (window.confirm(`Undo payment of ${amount}?`)) {
                                                                                voidPayment.mutate(
                                                                                    { invoiceId: invoice.id, paymentId: latest.id },
                                                                                    { onSuccess: () => { if (onRefresh) void onRefresh(); } },
                                                                                );
                                                                            }
                                                                        }}
                                                                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', color: '#f59e0b', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)', '&:hover': { bgcolor: 'rgba(245,158,11,0.08)' } }}>
                                                                        {voidPayment.isPending ? 'Undoing…' : 'Undo'}
                                                                    </Button>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteInvoice.mutate(invoice.id); }}
                                                            sx={{ color: '#64748b', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.15)', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' } }}>
                                                            <DeleteOutline sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </>
                    )}
                </CardContent>
            </WorkflowCard>
        </>
    );
};

export { PaymentTimelineCard };
