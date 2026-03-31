import React, { useState } from 'react';
import {
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { SwapHoriz, WarningAmber } from '@mui/icons-material';
import type { InquiryEquipmentAvailabilityRow, ReservationState } from '../../types';

export function formatEventDay(date?: string, start?: string | null, end?: string | null) {
    const parts: string[] = [];
    if (date) {
        parts.push(new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    }
    if (start || end) {
        parts.push([start, end].filter(Boolean).join(' – '));
    }
    return parts.join(' · ');
}

export interface EquipmentRowProps {
    row: InquiryEquipmentAvailabilityRow;
    reservationState?: ReservationState;
    onSwap?: (assignmentId: number, newEquipmentId: number) => void;
    swapping?: boolean;
}

export function EquipmentRow({
    row,
    reservationState,
    onSwap,
    swapping,
}: EquipmentRowProps) {
    const [showAlternatives, setShowAlternatives] = useState(false);
    const status = reservationState?.status;
    const isActive = status === 'reserved' || status === 'confirmed';
    const isConflict = row.has_conflict;
    const nonCurrentAlts = row.alternatives.filter((a) => !a.is_current);
    const hasAlternatives = nonCurrentAlts.length > 0;

    const dotColor = status === 'confirmed' ? '#10b981' : isActive ? '#f59e0b' : '#334155';
    const dotBorder = status === 'confirmed' ? '#10b981' : isActive ? '#f59e0b' : '#475569';
    const dotLabel = status === 'confirmed' ? 'Confirmed' : status === 'reserved' ? 'Reserved' : 'Not reserved';
    const accentColor = isConflict ? '#f59e0b' : isActive ? '#10b981' : '#334155';

    const alternativesBlock = hasAlternatives && showAlternatives ? (
        <Box sx={{ mt: 0.8, pl: 0.5 }}>
            {swapping ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5 }}>
                    <CircularProgress size={12} sx={{ color: '#60a5fa' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Swapping…</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {nonCurrentAlts.map((alt) => {
                        const hasConflict = (alt.conflicts?.length ?? 0) > 0;
                        const tooltip = hasConflict
                            ? `Conflict: ${alt.conflicts![0].title}`
                            : '';
                        return (
                            <Tooltip key={alt.id} title={tooltip} arrow placement="top">
                                <Chip
                                    size="small"
                                    label={alt.item_name}
                                    onClick={onSwap ? () => onSwap(row.id, alt.id) : undefined}
                                    sx={{
                                        height: 22, fontSize: '0.7rem',
                                        color: hasConflict ? '#fcd34d' : '#cbd5e1',
                                        bgcolor: hasConflict ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                                        border: `1px solid ${hasConflict ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.16)'}`,
                                        cursor: onSwap ? 'pointer' : 'default',
                                        ...(onSwap ? { '&:hover': { bgcolor: hasConflict ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.18)', borderColor: hasConflict ? 'rgba(245,158,11,0.45)' : 'rgba(59,130,246,0.35)' } } : {}),
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                </Box>
            )}
        </Box>
    ) : null;

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            pl: 1.25, pr: 1, py: 0.6,
            borderRadius: 1.5,
            borderLeft: `3px solid ${accentColor}`,
            bgcolor: isConflict ? 'rgba(245,158,11,0.04)' : 'rgba(15,23,42,0.3)',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                        {row.equipment.item_name}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: '0.65rem', color: '#64748b', mt: 0.1 }}>
                        {formatEventDay(row.event_day?.date, row.event_day?.start_time, row.event_day?.end_time) || 'No day set'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {hasAlternatives && (
                        <Tooltip title={showAlternatives ? 'Hide options' : 'Swap'} arrow placement="top">
                            <IconButton
                                size="small"
                                onClick={() => setShowAlternatives(!showAlternatives)}
                                sx={{
                                    p: 0.4,
                                    color: showAlternatives ? '#60a5fa' : '#475569',
                                    '&:hover': { color: '#60a5fa', bgcolor: 'rgba(59,130,246,0.1)' },
                                }}
                            >
                                <SwapHoriz sx={{ fontSize: 15 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {isConflict && (
                        <Tooltip title="Scheduling conflict" arrow placement="top">
                            <WarningAmber sx={{ fontSize: 13, color: '#f59e0b' }} />
                        </Tooltip>
                    )}
                    <Tooltip title={dotLabel} arrow placement="top">
                        <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: dotColor, border: `1.5px solid ${dotBorder}`,
                            flexShrink: 0,
                        }} />
                    </Tooltip>
                </Box>
            </Box>
            {isConflict && row.conflict_reason && (
                <Typography sx={{ fontSize: '0.68rem', color: '#fcd34d', mt: 0.3 }}>
                    {row.conflict_reason}
                </Typography>
            )}
            {alternativesBlock}
        </Box>
    );
}
