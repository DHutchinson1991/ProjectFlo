'use client';

import React, { useState, useCallback } from 'react';
import {
    Box, Typography, Stack, Chip, MenuItem, Select, FormControl,
    InputLabel, CircularProgress, Alert, Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    AccountBalance, CheckCircle, Warning,
} from '@mui/icons-material';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { paymentSchedulesApi } from '@/features/finance/payment-schedules';
import { usePaymentScheduleTemplates } from '@/features/finance/payment-schedules';
import { useBrand } from '@/features/platform/brand';
import type { Estimate } from '@/features/finance/estimates/types';
import type { Quote } from '@/features/finance/quotes/types';
import type { WorkflowCardProps } from '@/features/workflow/inquiries/lib/types';
import { WorkflowCard } from '@/features/workflow/inquiries/components/WorkflowCard';
import { roundMoney } from '@/shared/utils/pricing';
import { formatCurrency, DEFAULT_CURRENCY } from '@projectflo/shared';

const PaymentTermsCard: React.FC<WorkflowCardProps> = ({
    inquiry,
    onRefresh,
    isActive,
    activeColor,
}) => {
    const theme = useTheme();
    const { currentBrand } = useBrand();

    const MILESTONE_COLORS = [
        theme.palette.secondary.main,
        theme.palette.info.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        alpha(theme.palette.primary.main, 0.7),
        alpha(theme.palette.info.main, 0.7),
    ];

    const { data: templates = [], isLoading: loading, error: fetchError } = usePaymentScheduleTemplates();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(fetchError ? 'Failed to load payment schedule templates.' : null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<number | null>(
        inquiry.preferred_payment_schedule_template_id ?? null
    );

    // Sync selectedId from inquiry prop (handles external changes + initial pre-select)
    React.useEffect(() => {
        const prefId = inquiry.preferred_payment_schedule_template_id ?? null;
        if (prefId !== null) {
            setSelectedId(prefId);
        } else if (templates.length > 0 && selectedId === null) {
            const def = templates.find((t) => t.is_default);
            if (def) setSelectedId(def.id);
        }
    }, [inquiry.preferred_payment_schedule_template_id, templates]);

    const activeTemplate = templates.find((t) => t.id === selectedId) ?? null;

    const handleChange = useCallback(async (newId: number) => {
        if (newId === selectedId) return;
        setSelectedId(newId);
        setSaving(true);
        setError(null);
        try {
            const template = templates.find((t) => t.id === newId);
            if (!template) return;

            const bookingDate = new Date().toISOString().split('T')[0];
            const eventDate = inquiry.event_date
                ? new Date(inquiry.event_date).toISOString().split('T')[0]
                : bookingDate;

            // 1. Save preference on inquiry
            await inquiriesApi.update(inquiry.id, {
                preferred_payment_schedule_template_id: newId,
            });

            // 2. Apply to ALL estimates and quotes
            const allEstimates: Estimate[] = inquiry.estimates ?? [];
            const allQuotes: Quote[] = inquiry.quotes ?? [];

            await Promise.all([
                ...allEstimates.map((e) =>
                    paymentSchedulesApi.applyToEstimate(e.id, {
                        template_id: Number(template.id),
                        booking_date: bookingDate,
                        event_date: eventDate,
                        total_amount: Number(e.total_amount) || 0,
                    })
                ),
                ...allQuotes.map((q) =>
                    paymentSchedulesApi.applyToQuote(q.id, {
                        template_id: Number(template.id),
                        booking_date: bookingDate,
                        event_date: eventDate,
                        total_amount: Number(q.total_amount) || 0,
                    })
                ),
            ]);

            const docCount = allEstimates.length + allQuotes.length;
            setSuccessMsg(
                docCount > 0
                    ? `Saved & applied to ${docCount} document${docCount !== 1 ? 's' : ''}.`
                    : 'Payment terms saved.'
            );
            setTimeout(() => setSuccessMsg(null), 3500);

            // Refresh parent so estimates/quotes cards pick up milestones
            await onRefresh?.();
        } catch {
            setError('Failed to save payment terms.');
        } finally {
            setSaving(false);
        }
    }, [selectedId, templates, inquiry.event_date, inquiry.id, inquiry.estimates, inquiry.quotes, onRefresh]);

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <Box sx={{ p: 2.5 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <AccountBalance sx={{ color: activeColor || theme.palette.secondary.main, fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'text.primary', flex: 1 }}>
                        Payment Terms
                    </Typography>
                    {saving ? (
                        <CircularProgress size={16} sx={{ color: activeColor || theme.palette.secondary.main }} />
                    ) : inquiry.preferred_payment_schedule_template_id ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                    ) : null}
                </Stack>

                {/* Feedback alerts */}
                {successMsg && (
                    <Alert severity="success" sx={{ mb: 2, py: 0.5 }} onClose={() => setSuccessMsg(null)}>
                        {successMsg}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 2, py: 0.5 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : templates.length === 0 ? (
                    <Box sx={{
                        border: '1px dashed rgba(255,255,255,0.12)',
                        borderRadius: 2,
                        p: 2.5,
                        textAlign: 'center',
                    }}>
                        <Warning sx={{ color: 'warning.main', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No payment schedule templates configured for this brand.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Template selector — auto-saves on change */}
                        <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={saving}>
                            <InputLabel id="payment-terms-label">Schedule Template</InputLabel>
                            <Select
                                labelId="payment-terms-label"
                                value={selectedId ?? ''}
                                label="Schedule Template"
                                onChange={(e) => handleChange(Number(e.target.value))}
                            >
                                {templates.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>{t.name}</span>
                                            {t.is_default && (
                                                <Chip label="Default" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                                            )}
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Selected template preview — segmented bar visual with pricing */}
                        {activeTemplate && activeTemplate.rules.length > 0 && (() => {
                            // Compute total from all estimate amounts on this inquiry
                            const allEstimates: Estimate[] = inquiry.estimates ?? [];
                            const grandTotal = allEstimates.reduce((s, e) => s + (Number(e.total_amount) || 0), 0);
                            const hasPricing = grandTotal > 0;
                            const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;

                            const sorted = activeTemplate.rules.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
                            const rows = sorted.map((rule, i) => {
                                const pct = rule.amount_type === 'PERCENT' ? Number(rule.amount_value) : 0;
                                const amount = hasPricing
                                    ? (rule.amount_type === 'PERCENT' ? roundMoney((pct / 100) * grandTotal) : Number(rule.amount_value))
                                    : 0;
                                const trigger =
                                    rule.trigger_type === 'AFTER_BOOKING' ? `${rule.trigger_days ?? 0}d after booking` :
                                    rule.trigger_type === 'BEFORE_EVENT'  ? `${rule.trigger_days ?? 0}d before event`  :
                                    rule.trigger_type === 'AFTER_EVENT'   ? `${rule.trigger_days ?? 0}d after event`   :
                                    'On date';
                                return {
                                    label: rule.label,
                                    pct,
                                    amount,
                                    displayPct: rule.amount_type === 'PERCENT'
                                        ? `${rule.amount_value}%`
                                        : formatCurrency(Number(rule.amount_value), currency),
                                    trigger,
                                    color: MILESTONE_COLORS[i % MILESTONE_COLORS.length],
                                };
                            });
                            const barTotal = rows.reduce((s, r) => s + (r.pct || 1), 0) || 1;

                            return (
                                <Box sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, p: 2 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                        Schedule Breakdown
                                    </Typography>

                                    {/* Segmented split bar */}
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, mb: 1, height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                                        {rows.map((r, i) => (
                                            <Tooltip key={i} title={`${r.label}: ${hasPricing ? formatCurrency(r.amount, currency) : r.displayPct}`} arrow placement="top">
                                                <Box sx={{ flex: (r.pct || 1) / barTotal, bgcolor: r.color, borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                                            </Tooltip>
                                        ))}
                                    </Box>

                                    {/* Compact label chips */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, rowGap: 0.5, mb: 1.5 }}>
                                        {rows.map((r, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: r.color, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    {r.label}
                                                </Typography>
                                                {hasPricing ? (
                                                    <>
                                                        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontFamily: 'monospace', fontWeight: 700 }}>
                                                            {formatCurrency(r.amount, currency, 0)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary' }}>({r.displayPct})</Typography>
                                                    </>
                                                ) : (
                                                    <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontFamily: 'monospace', fontWeight: 700 }}>
                                                        {r.displayPct}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Detail rows */}
                                    <Stack spacing={0.5}>
                                        {rows.map((r, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 0.75, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${r.color}` }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.73rem', color: 'text.primary', fontWeight: 600, lineHeight: 1.2 }}>{r.label}</Typography>
                                                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.1 }}>{r.trigger}</Typography>
                                                </Box>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: r.color, minWidth: 48, textAlign: 'right' }}>
                                                    {hasPricing
                                                        ? formatCurrency(r.amount, currency)
                                                        : r.displayPct}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            );
                        })()}
                    </>
                )}
            </Box>
        </WorkflowCard>
    );
};

export default PaymentTermsCard;
