'use client';

import React from 'react';
import {
    Box, Typography, Chip, Collapse, Tooltip, IconButton,
} from '@mui/material';
import {
    Star, StarBorder, Edit, Delete, ExpandLess, ExpandMore,
} from '@mui/icons-material';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { formatCurrency } from '@projectflo/shared';
import { CategoryBreakdownBar, ExpandedCategoryItems } from '@/features/finance/shared';
import type { Quote } from '../types';

interface QuoteListItemProps {
    quote: Quote;
    isExpanded: boolean;
    currency: string;
    onToggleExpand: (id: number) => void;
    onEdit: (quote: Quote) => void;
    onDelete: (id: number, e: React.MouseEvent) => void;
    onSetPrimary: (id: number, e: React.MouseEvent) => void;
}

const QuoteListItem: React.FC<QuoteListItemProps> = ({
    quote, isExpanded, currency,
    onToggleExpand, onEdit, onDelete, onSetPrimary,
}) => {
    const { taxAmount, total: qPostTax } = computeTaxBreakdown(
        Number(quote.total_amount || 0),
        Number(quote.tax_rate || 0),
    );

    return (
        <Box
            sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: quote.is_primary ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.08)',
                overflow: 'hidden',
                bgcolor: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: quote.is_primary ? 'rgba(239,68,68,0.5)' : 'rgba(148,163,184,0.18)' },
            }}
        >
            {/* Header row */}
            <Box
                sx={{
                    px: 2, py: 1.5,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid rgba(148,163,184,0.08)' : 'none',
                }}
                onClick={() => onToggleExpand(quote.id)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {quote.is_primary && <Star sx={{ fontSize: 14, color: '#f59e0b' }} />}
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                            {quote.title || `Quote #${quote.quote_number}`}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                            <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                {quote.quote_number}
                            </Typography>
                            <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>
                                {new Date(quote.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={quote.status}
                        size="small"
                        sx={{
                            height: 20, fontSize: '0.6rem', fontWeight: 700,
                            bgcolor: quote.status === 'Accepted' ? 'rgba(16,185,129,0.15)' : quote.status === 'Sent' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                            color: quote.status === 'Accepted' ? '#10b981' : quote.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                            border: 'none',
                        }}
                    />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#f59e0b', fontFamily: 'monospace', minWidth: 70, textAlign: 'right' }}>
                        {formatCurrency(qPostTax, currency, 0)}
                    </Typography>
                    <Box sx={{ display: 'flex', ml: 0.5 }}>
                        <Tooltip title={quote.is_primary ? 'Primary' : 'Set as Primary'}>
                            <IconButton size="small" onClick={(e) => onSetPrimary(quote.id, e)} sx={{ p: 0.5, color: quote.is_primary ? '#f59e0b' : '#334155', '&:hover': { color: '#f59e0b' } }}>
                                {quote.is_primary ? <Star sx={{ fontSize: 15 }} /> : <StarBorder sx={{ fontSize: 15 }} />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(quote); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#94a3b8' } }}>
                                <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(quote.id, e); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#ef4444' } }}>
                                <Delete sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                        <IconButton size="small" sx={{ p: 0.5, color: '#334155' }}>
                            {isExpanded ? <ExpandLess sx={{ fontSize: 15 }} /> : <ExpandMore sx={{ fontSize: 15 }} />}
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* Collapsed breakdown bar */}
            {(quote.items?.length ?? 0) > 0 && !isExpanded && (
                <CategoryBreakdownBar
                    items={quote.items || []}
                    taxAmount={taxAmount}
                    taxRate={Number(quote.tax_rate)}
                    currency={currency}
                />
            )}

            {/* Expanded items */}
            <Collapse in={isExpanded}>
                <ExpandedCategoryItems
                    items={quote.items || []}
                    subtotal={Number(quote.total_amount || 0)}
                    totalWithTax={qPostTax}
                    taxRate={Number(quote.tax_rate)}
                    depositRequired={Number(quote.deposit_required)}
                    currency={currency}
                >
                    {(quote.consultation_notes || quote.notes) && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {quote.consultation_notes && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.5 }}>Consultation Notes</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{quote.consultation_notes}</Typography>
                                </Box>
                            )}
                            {quote.notes && (
                                <Box>
                                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.5 }}>Notes</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{quote.notes}</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </ExpandedCategoryItems>
            </Collapse>
        </Box>
    );
};

export default QuoteListItem;
