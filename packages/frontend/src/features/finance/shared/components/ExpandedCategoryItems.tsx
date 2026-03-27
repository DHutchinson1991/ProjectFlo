'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { getCategoryColor } from '../constants/categoryColors';
import { computeLineTotal } from '@/shared/utils/pricing';
import { formatCurrency } from '@projectflo/shared';

interface ExpandedItemsLineItem {
    id?: number;
    category?: string;
    description: string;
    quantity: number | string;
    unit_price: number | string;
}

interface ExpandedCategoryItemsProps {
    items: ExpandedItemsLineItem[];
    subtotal: number;
    totalWithTax: number;
    taxRate?: number;
    depositRequired?: number;
    currency: string;
    /** Slot for entity-specific extra content below the footer (e.g. notes) */
    children?: React.ReactNode;
}

const ExpandedCategoryItems: React.FC<ExpandedCategoryItemsProps> = ({
    items, subtotal, totalWithTax, taxRate, depositRequired, currency, children,
}) => {
    const grouped = items.reduce<Record<string, ExpandedItemsLineItem[]>>((acc, item) => {
        const c = item.category || 'Other';
        if (!acc[c]) acc[c] = [];
        acc[c].push(item);
        return acc;
    }, {});

    return (
        <Box sx={{ px: 2, py: 1.5 }}>
            {Object.entries(grouped).map(([cat, catItems]) => {
                const catColor = getCategoryColor(cat);
                const catTotal = catItems.reduce((s, i) => s + computeLineTotal(i.quantity, i.unit_price), 0);
                return (
                    <Box key={cat} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, pl: 0.5 }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                                {cat}
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: catColor, fontFamily: 'monospace' }}>
                                {formatCurrency(catTotal, currency)}
                            </Typography>
                        </Box>
                        {catItems.map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5, px: 0.5, borderLeft: `2px solid ${catColor}30` }}>
                                <Typography sx={{ flex: 1, fontSize: '0.78rem', color: '#cbd5e1' }}>{item.description}</Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                                    {formatCurrency(Number(item.unit_price), currency)} × {item.quantity}
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace', color: '#f1f5f9', minWidth: 70, textAlign: 'right' }}>
                                    {formatCurrency(computeLineTotal(item.quantity, item.unit_price), currency)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                );
            })}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, mt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {Number(depositRequired ?? 0) > 0 && (
                    <Typography sx={{ fontSize: '0.72rem', color: '#475569' }}>
                        Deposit: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{formatCurrency(Number(depositRequired), currency, 0)}</span>
                    </Typography>
                )}
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {Number(taxRate ?? 0) > 0 && (
                        <Typography sx={{ fontSize: '0.68rem', color: '#475569', fontFamily: 'monospace' }}>
                            {formatCurrency(subtotal, currency)} + {taxRate}% tax
                        </Typography>
                    )}
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'monospace', color: '#f59e0b' }}>
                        {formatCurrency(totalWithTax, currency, 0)}
                    </Typography>
                </Box>
            </Box>

            {children}
        </Box>
    );
};

export default ExpandedCategoryItems;
