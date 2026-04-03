'use client';

import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
    TrendingUp,
    LocalFireDepartment,
    TravelExplore,
    Schedule,
    CalendarToday,
} from '@mui/icons-material';
import { formatCurrency } from '@/shared/utils/formatUtils';
import type { MetricsPillsProps } from './types';

export default function MetricsPills({
    inquiry,
    needsAssessmentSubmission,
    conversionData,
    dealValue,
    currencyCode,
    validityDays,
}: MetricsPillsProps) {
    /* ---- inquiry period ---- */
    const createdDate = new Date(inquiry.created_at);
    const expiresDate = new Date(createdDate);
    expiresDate.setDate(expiresDate.getDate() + validityDays);
    const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / 86_400_000);
    const periodExpired = daysLeft < 0;
    const periodUrgent = daysLeft >= 0 && daysLeft <= 3;

    /* ---- derived lead source ---- */
    const naResponses = (needsAssessmentSubmission?.responses ?? {}) as Record<string, unknown>;
    const leadSource = inquiry.lead_source || naResponses.lead_source || null;

    return (
        <>
            {/* Lead Source pill — warm violet */}
            {leadSource && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    px: 1.5, py: 0.75, borderRadius: 2, minWidth: 0, height: 44,
                    bgcolor: 'rgba(167, 139, 250, 0.06)',
                    border: '1px solid rgba(167, 139, 250, 0.14)',
                }}>
                    <TravelExplore sx={{ fontSize: 14, color: '#a78bfa', flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Source</Typography>
                        <Typography title={String(leadSource)} sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {String(leadSource)}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Deal Value pill — amber/gold */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.5, py: 0.75, borderRadius: 2, height: 44,
                bgcolor: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.14)',
            }}>
                <TrendingUp sx={{ fontSize: 14, color: '#f59e0b' }} />
                <Box>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Value</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                        {dealValue > 0 ? formatCurrency(dealValue, currencyCode) : '\u2014'}
                    </Typography>
                </Box>
            </Box>

            {/* Combined Submitted + Offer Period pill — cyan/teal */}
            {(() => {
                const tealBase = '#06b6d4';
                const periodColor = periodExpired ? '#ef4444' : periodUrgent ? '#f59e0b' : tealBase;
                const periodBg = periodExpired
                    ? 'rgba(239, 68, 68, 0.06)'
                    : periodUrgent ? 'rgba(245, 158, 11, 0.06)' : 'rgba(6, 182, 212, 0.04)';
                const periodBorder = periodExpired
                    ? 'rgba(239, 68, 68, 0.12)'
                    : periodUrgent ? 'rgba(245, 158, 11, 0.12)' : 'rgba(6, 182, 212, 0.14)';
                const periodLabel = periodExpired
                    ? 'Expired'
                    : daysLeft === 0 ? 'Today'
                    : `${daysLeft}d left`;
                return (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0,
                        borderRadius: 2, height: 44, overflow: 'hidden',
                        border: `1px solid ${periodBorder}`,
                        position: 'relative',
                    }}>
                        {/* Submitted half */}
                        <Tooltip title={createdDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })} arrow placement="bottom">
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.5, height: '100%',
                            bgcolor: 'rgba(6, 182, 212, 0.06)',
                            cursor: 'default',
                        }}>
                            <CalendarToday sx={{ fontSize: 14, color: tealBase, opacity: 0.85 }} />
                            <Box>
                                <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Submitted</Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: tealBase, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                    {createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Typography>
                            </Box>
                        </Box>
                        </Tooltip>
                        {/* Dot divider */}
                        <Box sx={{
                            width: 4, height: 4, borderRadius: '50%',
                            bgcolor: 'rgba(100, 116, 139, 0.35)',
                            flexShrink: 0, mx: 0.25,
                        }} />
                        {/* Offer half */}
                        <Tooltip title={`Expires ${expiresDate.toLocaleDateString(undefined, { dateStyle: 'full' })}`} arrow placement="bottom">
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.5, height: '100%',
                            bgcolor: periodBg,
                            cursor: 'default',
                        }}>
                            <Schedule sx={{ fontSize: 14, color: periodColor, opacity: 0.85 }} />
                            <Box>
                                <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Offer</Typography>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: periodColor, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                                    {periodLabel}
                                </Typography>
                            </Box>
                        </Box>
                        </Tooltip>
                    </Box>
                );
            })()}

            {/* Deal Health pill */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.5, py: 0.75, borderRadius: 2, height: 44,
                bgcolor: `${conversionData.color}0A`,
                border: `1px solid ${conversionData.color}1A`,
            }}>
                <LocalFireDepartment sx={{ fontSize: 14, color: conversionData.color }} />
                <Box>
                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Health</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: conversionData.color, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            {conversionData.score}%
                        </Typography>
                        <Chip
                            label={conversionData.label}
                            size="small"
                            sx={{
                                height: 16, fontSize: '0.5rem', fontWeight: 800,
                                bgcolor: `${conversionData.color}15`, color: conversionData.color,
                                border: `1px solid ${conversionData.color}20`,
                                '& .MuiChip-label': { px: 0.75 },
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </>
    );
}
