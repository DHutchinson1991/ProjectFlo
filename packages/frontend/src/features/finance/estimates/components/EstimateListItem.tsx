'use client';

import React from 'react';
import {
    Box, Typography, Chip, Collapse, Tooltip, IconButton,
} from '@mui/material';
import {
    Star, StarBorder, Edit, Delete, ExpandLess, ExpandMore,
    Sync, EditNote, Send as SendIcon,
} from '@mui/icons-material';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { formatCurrency } from '@projectflo/shared';
import { CategoryBreakdownBar, ExpandedCategoryItems } from '@/features/finance/shared';
import type { Estimate } from '../types';

interface EstimateListItemProps {
    estimate: Estimate;
    isExpanded: boolean;
    currency: string;
    onToggleExpand: (id: number) => void;
    onEdit: (estimate: Estimate) => void;
    onDelete: (id: number, e: React.MouseEvent) => void;
    onSetPrimary: (id: number, e: React.MouseEvent) => void;
    onRefreshCosts: (id: number, e: React.MouseEvent) => void;
    onRevise: (id: number, e: React.MouseEvent) => void;
    onSend: (id: number, e: React.MouseEvent) => void;
    onVersionClick: (id: number, anchor: HTMLElement) => void;
}

const EstimateListItem: React.FC<EstimateListItemProps> = ({
    estimate, isExpanded, currency,
    onToggleExpand, onEdit, onDelete, onSetPrimary, onRefreshCosts, onRevise, onSend, onVersionClick,
}) => {
    const { taxAmount, total: estPostTax } = computeTaxBreakdown(
        Number(estimate.total_amount ?? 0),
        Number(estimate.tax_rate ?? 0),
    );

    return (
        <Box
            sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: estimate.is_primary ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.08)',
                overflow: 'hidden',
                bgcolor: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: estimate.is_primary ? 'rgba(16,185,129,0.5)' : 'rgba(148,163,184,0.18)' },
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
                onClick={() => onToggleExpand(estimate.id)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {estimate.is_primary && <Star sx={{ fontSize: 14, color: '#f59e0b' }} />}
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9', lineHeight: 1.2 }}>
                            {estimate.title || `Estimate #${estimate.estimate_number}`}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                            <Typography sx={{ fontSize: '0.68rem', color: '#475569' }}>
                                {estimate.estimate_number}
                            </Typography>
                            {(estimate.version ?? 1) > 1 && (
                                <Chip
                                    label={`v${estimate.version}`}
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onVersionClick(estimate.id, e.currentTarget);
                                    }}
                                    sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'none', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(139,92,246,0.22)' } }}
                                />
                            )}
                            <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>
                                {new Date(estimate.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={estimate.status}
                        size="small"
                        sx={{
                            height: 20, fontSize: '0.6rem', fontWeight: 700,
                            bgcolor: estimate.status === 'Accepted' ? 'rgba(16,185,129,0.15)' : estimate.status === 'Sent' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)',
                            color: estimate.status === 'Accepted' ? '#10b981' : estimate.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                            border: 'none',
                        }}
                    />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#f59e0b', fontFamily: 'monospace', minWidth: 70, textAlign: 'right' }}>
                        {formatCurrency(estPostTax, currency, 0)}
                    </Typography>
                    <Box sx={{ display: 'flex', ml: 0.5 }}>
                        <Tooltip title={estimate.is_primary ? 'Primary' : 'Set as Primary'}>
                            <IconButton size="small" onClick={(e) => onSetPrimary(estimate.id, e)} sx={{ p: 0.5, color: estimate.is_primary ? '#f59e0b' : '#334155', '&:hover': { color: '#f59e0b' } }}>
                                {estimate.is_primary ? <Star sx={{ fontSize: 15 }} /> : <StarBorder sx={{ fontSize: 15 }} />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(estimate); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#94a3b8' } }}>
                                <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                        {estimate.status === 'Draft' && (
                            <Tooltip title={estimate.is_stale ? '⚠ Package updated — costs may be stale. Click to sync.' : 'Refresh Costs'}>
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <IconButton size="small" onClick={(e) => onRefreshCosts(estimate.id, e)} sx={{ p: 0.5, color: estimate.is_stale ? '#f59e0b' : '#334155', '&:hover': { color: estimate.is_stale ? '#f97316' : '#06b6d4' } }}>
                                        <Sync sx={{ fontSize: 15 }} />
                                    </IconButton>
                                    {estimate.is_stale && (
                                        <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }} />
                                    )}
                                </Box>
                            </Tooltip>
                        )}
                        {estimate.status === 'Sent' && estimate.is_stale && (
                            <Tooltip title="⚠ Crew or package changed since this estimate was sent. Click to revise.">
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <IconButton size="small" onClick={(e) => onRevise(estimate.id, e)} sx={{ p: 0.5, color: '#f59e0b', '&:hover': { color: '#f97316' } }}>
                                        <EditNote sx={{ fontSize: 15 }} />
                                    </IconButton>
                                    <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }} />
                                </Box>
                            </Tooltip>
                        )}
                        {estimate.status === 'Draft' && (
                            <Tooltip title="Send Estimate">
                                <IconButton size="small" onClick={(e) => onSend(estimate.id, e)} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#10b981' } }}>
                                    <SendIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Delete">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(estimate.id, e); }} sx={{ p: 0.5, color: '#334155', '&:hover': { color: '#ef4444' } }}>
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
            {(estimate.items?.length ?? 0) > 0 && !isExpanded && (
                <CategoryBreakdownBar
                    items={estimate.items || []}
                    taxAmount={taxAmount}
                    taxRate={Number(estimate.tax_rate)}
                    currency={currency}
                />
            )}

            {/* Expanded items */}
            <Collapse in={isExpanded}>
                <ExpandedCategoryItems
                    items={estimate.items || []}
                    subtotal={Number(estimate.total_amount || 0)}
                    totalWithTax={estPostTax}
                    taxRate={Number(estimate.tax_rate)}
                    depositRequired={Number(estimate.deposit_required)}
                    currency={currency}
                >
                    {estimate.notes && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 0.5 }}>Notes</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{estimate.notes}</Typography>
                        </Box>
                    )}
                </ExpandedCategoryItems>
            </Collapse>
        </Box>
    );
};

export default EstimateListItem;
