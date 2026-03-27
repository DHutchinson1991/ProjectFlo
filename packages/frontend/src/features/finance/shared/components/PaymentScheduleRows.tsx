'use client';

import React from 'react';
import { Box, Typography, Chip, Stack, Tooltip } from '@mui/material';
import type { FinanceMilestone } from '../types';
import type { PaymentScheduleTemplate } from '@/features/finance/payment-schedules/types';
import { roundMoney } from '@/shared/utils/pricing';
import { formatCurrency } from '@projectflo/shared';

const MILESTONE_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#818cf8', '#2dd4bf'];

interface PayRow {
    label: string;
    amount: number;
    pct: number;
    trigger: string;
    status?: string;
    color: string;
}

interface PaymentScheduleRowsProps {
    milestones: FinanceMilestone[];
    previewTemplate?: PaymentScheduleTemplate | null;
    totalAmount: number;
    currency: string;
    emptyMessage?: string;
}

const PaymentScheduleRows: React.FC<PaymentScheduleRowsProps> = ({
    milestones, previewTemplate, totalAmount, currency, emptyMessage,
}) => {
    let rows: PayRow[] = [];

    if (milestones.length > 0) {
        rows = milestones.map((m, i) => {
            const amt = Number(m.amount);
            const pct = totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
            const statusColor =
                m.status === 'PAID' ? '#10b981' :
                m.status === 'OVERDUE' ? '#ef4444' :
                MILESTONE_COLORS[i % MILESTONE_COLORS.length];
            return {
                label: m.label,
                amount: amt,
                pct,
                trigger: m.due_date
                    ? new Date(m.due_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'TBD',
                status: m.status,
                color: statusColor,
            };
        });
    } else if (previewTemplate?.rules?.length) {
        const sorted = previewTemplate.rules.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        rows = sorted.map((rule, i) => {
            const amt = rule.amount_type === 'PERCENT'
                ? roundMoney((Number(rule.amount_value) / 100) * totalAmount)
                : Number(rule.amount_value);
            const pct = rule.amount_type === 'PERCENT'
                ? Number(rule.amount_value)
                : totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
            const trigger =
                rule.trigger_type === 'AFTER_BOOKING' ? `${rule.trigger_days ?? 0}d after booking` :
                rule.trigger_type === 'BEFORE_EVENT'  ? `${rule.trigger_days ?? 0}d before event`  :
                rule.trigger_type === 'AFTER_EVENT'   ? `${rule.trigger_days ?? 0}d after event`   :
                'On date';
            return { label: rule.label, amount: amt, pct, trigger, color: MILESTONE_COLORS[i % MILESTONE_COLORS.length] };
        });
    }

    if (rows.length === 0) {
        return (
            <Typography sx={{ fontSize: '0.75rem', color: '#334155', fontStyle: 'italic' }}>
                {emptyMessage ?? 'No schedule configured.'}
            </Typography>
        );
    }

    const barTotal = rows.reduce((s, r) => s + r.amount, 0) || 1;

    return (
        <>
            {/* Segmented bar */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                {rows.map((r, i) => (
                    <Tooltip key={i} title={`${r.label}: ${formatCurrency(r.amount, currency)} (${Math.round(r.pct)}%)`} arrow placement="top">
                        <Box sx={{ flex: r.amount / barTotal, bgcolor: r.color, borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                    </Tooltip>
                ))}
            </Box>
            {/* Label chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, rowGap: 0.5, mb: 1.5 }}>
                {rows.map((r, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: r.color, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.label}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                            {formatCurrency(r.amount, currency, 0)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.58rem', color: '#475569' }}>({Math.round(r.pct)}%)</Typography>
                    </Box>
                ))}
            </Box>
            {/* Individual rows */}
            <Stack spacing={0.5}>
                {rows.map((r, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 0.75, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${r.color}` }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.73rem', color: '#cbd5e1', fontWeight: 600, lineHeight: 1.2 }}>{r.label}</Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#475569', mt: 0.1 }}>{r.trigger}</Typography>
                        </Box>
                        {r.status && (
                            <Chip label={r.status} size="small" sx={{
                                height: 15, fontSize: '0.52rem',
                                bgcolor: r.status === 'PAID' ? 'rgba(16,185,129,0.15)' : r.status === 'OVERDUE' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.08)',
                                color: r.status === 'PAID' ? '#10b981' : r.status === 'OVERDUE' ? '#ef4444' : '#64748b',
                                border: 'none',
                            }} />
                        )}
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: r.color, minWidth: 56, textAlign: 'right' }}>
                            {formatCurrency(r.amount, currency)}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </>
    );
};

export default PaymentScheduleRows;
