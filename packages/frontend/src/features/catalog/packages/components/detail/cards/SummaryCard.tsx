'use client';

import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import VideocamIcon from '@mui/icons-material/Videocam';

import { formatCurrency } from '@/shared/utils/formatUtils';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import type { TaskAutoGenerationPreview } from '@/features/catalog/task-library/types';
import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';

import type { PackageCrewSlotRecord, EquipmentRecord } from '../../../types';
import { computeCrewCost, computeEquipmentCost } from '../../../utils/selectors';

// ─── Props ──────────────────────────────────────────────────────────
export interface SummaryCardProps {
    PackageCrewSlots: PackageCrewSlotRecord[];
    taskPreview: TaskAutoGenerationPreview | null;
    contents: Partial<ServicePackage>['contents'];
    allEquipment: EquipmentRecord[];
    currency: string;
    taxRate?: number;
    cardSx: SxProps<Theme>;
}

// ─── Component ──────────────────────────────────────────────────────
export function SummaryCard({
    PackageCrewSlots,
    taskPreview,
    contents,
    allEquipment,
    currency,
    taxRate,
    cardSx,
}: SummaryCardProps) {
    const totalCrewCost = computeCrewCost(PackageCrewSlots, taskPreview);
    const totalEquipCost = computeEquipmentCost(contents, PackageCrewSlots, allEquipment);
    const subtotal = totalCrewCost + totalEquipCost;
    const tax = computeTaxBreakdown(subtotal, taxRate ?? 0);

    return (
        <Box sx={{
            ...(cardSx as object),
            display: 'flex', alignItems: 'center', gap: 3,
            px: 3, py: 2,
            minWidth: 420,
            background: 'linear-gradient(135deg, rgba(16, 18, 22, 0.9), rgba(16, 18, 22, 0.8))',
            border: '1px solid rgba(245, 158, 11, 0.2)',
        }}>
                {/* Crew cost */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 13, color: '#EC4899' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            Crew
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: totalCrewCost > 0 ? '#e2e8f0' : '#475569', fontWeight: 700, fontFamily: 'monospace' }}>
                        {formatCurrency(totalCrewCost, currency)}
                    </Typography>
                </Box>

                <Typography sx={{ color: '#334155', fontSize: '1rem', fontWeight: 300 }}>+</Typography>

                {/* Equipment cost */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VideocamIcon sx={{ fontSize: 13, color: '#10b981' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            Equipment
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: totalEquipCost > 0 ? '#e2e8f0' : '#475569', fontWeight: 700, fontFamily: 'monospace' }}>
                        {formatCurrency(totalEquipCost, currency)}
                    </Typography>
                </Box>

                <Typography sx={{ color: '#334155', fontSize: '1rem', fontWeight: 300 }}>
                    {tax.taxRate > 0 ? '+' : '='}
                </Typography>

                {tax.taxRate > 0 && (
                    <>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    Tax
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 700, fontFamily: 'monospace' }}>
                                {formatCurrency(tax.taxAmount, currency)}
                            </Typography>
                        </Box>

                        <Typography sx={{ color: '#334155', fontSize: '1rem', fontWeight: 300 }}>=</Typography>
                    </>
                )}

                {/* Total cost */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25,
                    pl: 1.5, borderLeft: '1px solid rgba(245, 158, 11, 0.2)',
                }}>
                    <Typography sx={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total Cost
                    </Typography>
                    <Typography sx={{
                        fontSize: '1.2rem',
                        color: subtotal > 0 ? '#f59e0b' : '#475569',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {formatCurrency(tax.total, currency)}
                    </Typography>
                </Box>
        </Box>
    );
}
