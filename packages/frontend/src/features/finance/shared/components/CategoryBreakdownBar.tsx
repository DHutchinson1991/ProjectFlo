'use client';

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { getCategoryColor } from '../constants/categoryColors';
import { computeLineTotal } from '@/shared/utils/pricing';
import { formatCurrency } from '@projectflo/shared';

interface CategoryBreakdownBarProps {
    items: { category?: string; quantity: number | string; unit_price: number | string }[];
    taxAmount: number;
    taxRate?: number;
    currency: string;
}

const CategoryBreakdownBar: React.FC<CategoryBreakdownBarProps> = ({
    items, taxAmount, taxRate, currency,
}) => {
    const grouped = items.reduce<Record<string, number>>((acc, item) => {
        const raw = item.category || 'Other';
        const cat = raw.startsWith('Post-Production') ? 'Post-Production' : raw;
        acc[cat] = (acc[cat] || 0) + computeLineTotal(item.quantity, item.unit_price);
        return acc;
    }, {});

    const subtotal = Object.values(grouped).reduce((s, v) => s + v, 0);
    const barTotal = (subtotal + taxAmount) || 1;

    return (
        <Box sx={{ px: 2, pt: 0.75, pb: 1.25 }}>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.04)' }}>
                {Object.entries(grouped).map(([cat, total]) => (
                    <Tooltip key={cat} title={`${cat}: ${formatCurrency(total, currency)}`} arrow placement="top">
                        <Box sx={{ flex: total / barTotal, bgcolor: getCategoryColor(cat), borderRadius: 1, minWidth: 4, transition: 'flex 0.3s' }} />
                    </Tooltip>
                ))}
                {taxAmount > 0 && (
                    <Tooltip title={`Tax (${taxRate ?? 0}%): ${formatCurrency(taxAmount, currency)}`} arrow placement="top">
                        <Box sx={{ flex: taxAmount / barTotal, bgcolor: '#f59e0b', borderRadius: 1, minWidth: 4, transition: 'flex 0.3s', opacity: 0.7 }} />
                    </Tooltip>
                )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, rowGap: 0.5 }}>
                {Object.entries(grouped).map(([cat, total]) => (
                    <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getCategoryColor(cat), flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{cat}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                            {formatCurrency(total, currency)}
                        </Typography>
                    </Box>
                ))}
                {taxAmount > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b', flexShrink: 0, opacity: 0.7 }} />
                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Tax ({taxRate ?? 0}%)
                        </Typography>
                        <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>
                            {formatCurrency(taxAmount, currency)}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default CategoryBreakdownBar;
