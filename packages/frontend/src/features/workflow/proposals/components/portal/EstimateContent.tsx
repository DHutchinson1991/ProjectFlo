"use client";

import React from 'react';
import { Box, Typography, Stack, Divider, Chip, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

import { computeTaxBreakdown, computeLineTotal } from '@/shared/utils/pricing';
import { formatCurrency } from '@/features/workflow/proposals/utils/portal/formatting';
import type { PortalDashboardColors } from '@/features/workflow/proposals/utils/portal/themes';
import type { EstimateData } from './PortalSectionContent';

const CATEGORY_COLORS: Record<string, string> = {
    Coverage: '#648CFF', Planning: '#a855f7', 'Post-Production': '#f97316',
    Travel: '#06b6d4', Equipment: '#10b981', Discount: '#ef4444', Other: '#94a3b8',
};
function getCatColor(raw: string): string {
    const key = raw.startsWith('Post-Production') ? 'Post-Production' : raw;
    return CATEGORY_COLORS[key] ?? '#94a3b8';
}
const toNum = (v: string | number) => typeof v === 'string' ? parseFloat(v) : v;

export function EstimateContent({ data, colors, currency }: { data: EstimateData; colors: PortalDashboardColors; currency: string }) {
    const est = data;

    /* Group items by category */
    const grouped: Record<string, typeof est.items> = {};
    for (const item of est.items) {
        const cat = item.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    }
    const categories = Object.keys(grouped);

    /* Totals */
    const subtotal = est.items.reduce((s, i) => s + computeLineTotal(i.quantity, i.unit_price), 0);
    const taxRate = est.tax_rate ? toNum(est.tax_rate) : 0;
    const { taxAmount, total: grandTotal } = computeTaxBreakdown(subtotal, taxRate);

    /* Category totals for breakdown bar */
    const catTotals: Record<string, number> = {};
    for (const [cat, items] of Object.entries(grouped)) {
        const key = cat.startsWith('Post-Production') ? 'Post-Production' : cat;
        catTotals[key] = (catTotals[key] ?? 0) + items.reduce((s, i) => s + computeLineTotal(i.quantity, i.unit_price), 0);
    }
    const barTotal = (subtotal + taxAmount) || 1;

    return (
        <Box>
            {/* Header */}
            <Box sx={{
                px: { xs: 2.5, md: 3 }, py: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 34, height: 34, borderRadius: '50%',
                        bgcolor: alpha(colors.accent, 0.12),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ReceiptIcon sx={{ fontSize: 17, color: colors.accent }} />
                    </Box>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
                        {est.title ?? est.estimate_number}
                    </Typography>
                </Box>
                <Chip
                    label={est.status} size="small"
                    sx={{
                        height: 22, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
                        bgcolor: alpha(est.status === 'Accepted' ? '#22c55e' : '#06b6d4', 0.12),
                        color: est.status === 'Accepted' ? '#22c55e' : '#06b6d4',
                        border: `1px solid ${alpha(est.status === 'Accepted' ? '#22c55e' : '#06b6d4', 0.25)}`,
                    }}
                />
            </Box>

            {/* Category breakdown bar */}
            <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 1.5 }}>
                <Box sx={{ display: 'flex', gap: '3px', mb: 1, height: 5, borderRadius: 2, overflow: 'hidden', bgcolor: alpha(colors.muted, 0.08) }}>
                    {Object.entries(catTotals).map(([cat, total]) => (
                        <Tooltip key={cat} title={`${cat}: ${formatCurrency(total, currency)}`} arrow placement="top">
                            <Box sx={{ flex: total / barTotal, bgcolor: getCatColor(cat), borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                        </Tooltip>
                    ))}
                    {taxAmount > 0 && (
                        <Tooltip title={`Tax (${taxRate}%): ${formatCurrency(taxAmount, currency)}`} arrow placement="top">
                            <Box sx={{ flex: taxAmount / barTotal, bgcolor: '#f59e0b', borderRadius: 1, minWidth: 4, transition: 'flex 0.3s', opacity: 0.7 }} />
                        </Tooltip>
                    )}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, rowGap: 0.5 }}>
                    {Object.entries(catTotals).map(([cat, total]) => (
                        <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: getCatColor(cat), flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.64rem', fontWeight: 600, color: colors.muted, whiteSpace: 'nowrap' }}>{cat}</Typography>
                            <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: alpha(colors.text, 0.65), fontFamily: 'monospace' }}>
                                {formatCurrency(total, currency)}
                            </Typography>
                        </Box>
                    ))}
                    {taxAmount > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#f59e0b', flexShrink: 0, opacity: 0.7 }} />
                            <Typography sx={{ fontSize: '0.64rem', fontWeight: 600, color: colors.muted }}>Tax ({taxRate}%)</Typography>
                            <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: alpha(colors.text, 0.65), fontFamily: 'monospace' }}>
                                {formatCurrency(taxAmount, currency)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Divider sx={{ borderColor: alpha(colors.muted, 0.1) }} />

            {/* Line items grouped by category */}
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2 }}>
                {categories.map((cat, ci) => {
                    const catColor = getCatColor(cat);
                    const catTotal = grouped[cat].reduce((s, i) => s + computeLineTotal(i.quantity, i.unit_price), 0);
                    return (
                        <Box key={cat} sx={{ mb: ci < categories.length - 1 ? 2 : 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, pl: 0.5 }}>
                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    {cat}
                                </Typography>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: catColor, fontFamily: 'monospace' }}>
                                    {formatCurrency(catTotal, currency)}
                                </Typography>
                            </Box>
                            {grouped[cat].map((item, i) => {
                                const lineTotal = computeLineTotal(item.quantity, item.unit_price);
                                return (
                                    <Box key={item.id ?? i} sx={{
                                        display: 'flex', alignItems: 'center', gap: 2,
                                        py: 0.6, px: 0.5,
                                        borderLeft: `2px solid ${alpha(catColor, 0.2)}`,
                                    }}>
                                        <Typography sx={{ flex: 1, fontSize: '0.8rem', color: colors.text, minWidth: 0 }}>
                                            {item.description}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: colors.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                            {formatCurrency(toNum(item.unit_price), currency)} × {toNum(item.quantity)}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', color: colors.text, minWidth: 70, textAlign: 'right' }}>
                                            {formatCurrency(lineTotal, currency)}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    );
                })}
            </Box>

            <Divider sx={{ borderColor: alpha(colors.muted, 0.1) }} />

            {/* Footer totals */}
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
                {taxRate > 0 && (
                    <Typography sx={{ fontSize: '0.7rem', color: colors.muted, fontFamily: 'monospace' }}>
                        {formatCurrency(subtotal, currency)} + {taxRate}% tax
                    </Typography>
                )}
                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', fontFamily: 'monospace', color: colors.accent, letterSpacing: '-0.02em' }}>
                    {formatCurrency(grandTotal, currency)}
                </Typography>
            </Box>

            {/* Notes */}
            {est.notes && (
                <>
                    <Divider sx={{ borderColor: alpha(colors.muted, 0.1) }} />
                    <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: colors.muted, lineHeight: 1.7 }}>
                            {est.notes}
                        </Typography>
                    </Box>
                </>
            )}
        </Box>
    );
}
