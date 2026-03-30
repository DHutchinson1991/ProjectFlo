'use client';

import React from 'react';
import { Box, Typography, Chip, Stack, Popover, CircularProgress } from '@mui/material';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { formatCurrency } from '@projectflo/shared';
import { useBrand } from '@/features/platform/brand';
import type { Estimate, EstimateSnapshot } from '../types';

interface EstimateVersionPopoverProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    estimate: Estimate | null;
    snapshots: EstimateSnapshot[];
    loading: boolean;
    currency: string;
}

const EstimateVersionPopover: React.FC<EstimateVersionPopoverProps> = ({
    anchorEl, onClose, estimate, snapshots, loading, currency,
}) => {
    const { currentBrand } = useBrand();
    const taxRate = Number(currentBrand?.default_tax_rate ?? 0);
    return (
        <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
                sx: {
                    bgcolor: '#111827',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    minWidth: 260, maxWidth: 340, maxHeight: 320,
                },
            }}
        >
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1 }}>
                Version History
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={18} sx={{ color: '#a78bfa' }} />
                </Box>
            ) : snapshots.length === 0 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#334155', py: 1 }}>
                    No previous versions saved
                </Typography>
            ) : (
                <Stack spacing={0.5}>
                    {/* Current version */}
                    {estimate && (() => {
                        const { total } = computeTaxBreakdown(Number(estimate.total_amount || 0), taxRate);
                        return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <Chip label={`v${estimate.version}`} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: 'none' }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 600 }}>Current</Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', fontFamily: 'monospace', color: '#a78bfa' }}>
                                    {formatCurrency(total, currency)}
                                </Typography>
                            </Box>
                        );
                    })()}
                    {/* Previous versions */}
                    {snapshots.map((snap) => (
                        <Box key={snap.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                            <Chip label={`v${snap.version_number}`} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(139,92,246,0.08)', color: '#7c3aed', border: 'none' }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.62rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {snap.label || 'Snapshot'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.55rem', color: '#334155' }}>
                                    {new Date(snap.snapshotted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {' · '}{snap.items_snapshot.length} item{snap.items_snapshot.length !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748b' }}>
                                {formatCurrency(Number(snap.total_amount), currency)}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            )}
        </Popover>
    );
};

export default EstimateVersionPopover;
