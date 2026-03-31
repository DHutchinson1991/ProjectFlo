import React, { useState } from 'react';
import {
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { CheckCircle, ErrorOutline, RadioButtonUnchecked, SwapHoriz, WarningAmber } from '@mui/icons-material';
import type { InquiryCrewAvailabilityRow } from '../../types';

export function formatDayHeader(date: string, start?: string | null, end?: string | null) {
    const d = new Date(date);
    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const time = [start, end].filter(Boolean).join(' – ');
    return time ? `${label}  ·  ${time}` : label;
}

export interface CrewRowProps {
    row: InquiryCrewAvailabilityRow;
    onSwap?: (slotId: number, alternativeCrewId: number) => void;
    swapping?: boolean;
    confirmed?: boolean;
    onToggleConfirmed?: (slotId: number, confirmed: boolean) => void;
}

export function CrewRow({ row, onSwap, swapping, confirmed, onToggleConfirmed }: CrewRowProps) {
    const [showAlternatives, setShowAlternatives] = useState(false);
    const rawName = row.label || row.job_role?.display_name || row.job_role?.name || 'Crew Slot';
    const roleName = rawName.replace(/\s*\(.*\)$/, '');
    const nonCurrentAlts = row.alternatives
        .filter((a) => !a.is_current)
        .sort((a, b) => (b.has_role ? 1 : 0) - (a.has_role ? 1 : 0));
    const hasAlternatives = nonCurrentAlts.length > 0;
    const isConflict = row.has_conflict;
    const accentColor = isConflict ? '#f59e0b' : confirmed ? '#10b981' : '#64748b';

    const alternativesBlock = hasAlternatives && showAlternatives ? (
        <Box sx={{ mt: 0.8, pl: 0.5 }}>
            {swapping ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5 }}>
                    <CircularProgress size={12} sx={{ color: '#60a5fa' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Reassigning…</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {nonCurrentAlts.map((alt) => {
                        const hasConflict = (alt.conflicts?.length ?? 0) > 0;
                        const tooltip = hasConflict
                            ? `Conflict: ${alt.conflicts![0].title}`
                            : !alt.has_role ? 'No matching role' : '';
                        return (
                            <Tooltip key={alt.id} title={tooltip} arrow placement="top">
                                <Chip
                                    size="small"
                                    label={alt.name}
                                    onClick={onSwap ? () => onSwap(row.id, alt.id) : undefined}
                                    sx={{
                                        height: 22, fontSize: '0.7rem',
                                        color: hasConflict ? '#fcd34d' : !alt.has_role ? '#94a3b8' : '#cbd5e1',
                                        bgcolor: hasConflict ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                                        border: `1px solid ${hasConflict ? 'rgba(245,158,11,0.25)' : !alt.has_role ? 'rgba(100,116,139,0.2)' : 'rgba(59,130,246,0.16)'}`,
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
                        {roleName}
                    </Typography>
                    {isConflict && row.conflict_reason && (
                        <Typography sx={{ fontSize: '0.68rem', color: '#fcd34d', mt: 0.1 }}>
                            {row.conflict_reason}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                    {hasAlternatives && (
                        <Tooltip title={showAlternatives ? 'Hide options' : 'Reassign'} arrow placement="top">
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
                    {isConflict ? (
                        <Tooltip title={row.status === 'unassigned' ? 'Unassigned' : 'Scheduling conflict'} arrow placement="top">
                            <WarningAmber sx={{ fontSize: 14, color: '#f59e0b' }} />
                        </Tooltip>
                    ) : confirmed ? (
                        <Tooltip title="Confirmed — click to unconfirm" arrow placement="top">
                            <IconButton
                                size="small"
                                onClick={() => onToggleConfirmed?.(row.id, false)}
                                sx={{ p: 0.2, color: '#10b981', '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}
                            >
                                <CheckCircle sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Click to confirm" arrow placement="top">
                            <IconButton
                                size="small"
                                onClick={() => onToggleConfirmed?.(row.id, true)}
                                sx={{ p: 0.2, color: '#475569', '&:hover': { color: '#10b981', bgcolor: 'rgba(16,185,129,0.1)' } }}
                            >
                                <RadioButtonUnchecked sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
            {isConflict && row.conflicts.length > 0 && (
                <Stack spacing={0.3} sx={{ mt: 0.4 }}>
                    {row.conflicts.map((conflict) => (
                        <Box key={`${conflict.type}-${conflict.id}-${conflict.event_day_name}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ErrorOutline sx={{ fontSize: 11, color: '#f59e0b' }} />
                            <Typography sx={{ fontSize: '0.68rem', color: '#fcd34d' }}>
                                {conflict.title}{conflict.event_day_name ? ` · ${conflict.event_day_name}` : ''}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            )}
            {alternativesBlock}
        </Box>
    );
}
