'use client';

/**
 * ProposalSchedulePreview — read-only event day timeline for proposal sections.
 *
 * Fetches the inquiry/project's instance schedule data via the snapshot endpoints
 * and renders a compact visual timeline with colored activity bars, event days,
 * activity details, and timing.
 *
 * Used inside the proposal builder's "schedule" section type.
 */

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Stack, Chip, CircularProgress,
    Alert, Divider, Tooltip,
} from '@mui/material';
import {
    CalendarToday as DayIcon,
    Schedule as ActivityIcon,
    AccessTime as TimeIcon,
} from '@mui/icons-material';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────

interface ProposalSchedulePreviewProps {
    ownerType: 'inquiry' | 'project';
    ownerId: number;
    showDetails?: boolean;
}

interface EventDayData {
    id: number;
    name: string;
    order_index: number;
    activities?: ActivityData[];
}

interface ActivityData {
    id: number;
    name: string;
    color?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    description?: string | null;
    order_index?: number;
    moments?: Array<{ id: number; name: string; duration_minutes?: number }>;
}

// ─── Constants ────────────────────────────────────────────────────────

const ACTIVITY_COLORS = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

// ─── Helpers ──────────────────────────────────────────────────────────

function formatTime(t: string | null | undefined): string {
    if (!t) return '';
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return t;
    const h = parseInt(m[1], 10);
    const mins = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${mins} ${ampm}`;
}

function timeRange(start: string | null | undefined, end: string | null | undefined): string {
    if (!start && !end) return '';
    if (start && end) return `${formatTime(start)} – ${formatTime(end)}`;
    if (start) return `from ${formatTime(start)}`;
    return `until ${formatTime(end)}`;
}

/** Parse "HH:MM" → minutes from midnight. */
function parseMinutes(t: string | null | undefined): number | null {
    if (!t) return null;
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Compute the overall time window for a list of activities. */
function dayTimeWindow(acts: ActivityData[]): { minMin: number; maxMin: number } | null {
    let min = Infinity;
    let max = -Infinity;
    for (const a of acts) {
        const s = parseMinutes(a.start_time);
        const e = parseMinutes(a.end_time);
        if (s != null) min = Math.min(min, s);
        if (e != null) max = Math.max(max, e);
        // If only start, assume 30 min
        if (s != null && e == null) max = Math.max(max, s + 30);
    }
    if (min === Infinity || max === -Infinity) return null;
    if (max <= min) max = min + 60;
    return { minMin: min, maxMin: max };
}

// ─── Component ────────────────────────────────────────────────────────

export default function ProposalSchedulePreview({
    ownerType,
    ownerId,
    showDetails = true,
}: ProposalSchedulePreviewProps) {
    const [eventDays, setEventDays] = useState<EventDayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const fetchFn = ownerType === 'project'
            ? api.schedule.projectPackageSnapshot.getEventDays(ownerId)
            : api.inquiries.scheduleSnapshot.getEventDays(ownerId);

        fetchFn
            .then((data: EventDayData[]) => {
                if (!cancelled) setEventDays(data || []);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || 'Failed to load schedule');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [ownerType, ownerId]);

    if (loading) {
        return (
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="warning" sx={{ mt: 1 }}>
                Could not load schedule timeline
            </Alert>
        );
    }

    if (eventDays.length === 0) {
        return (
            <Alert severity="info" sx={{ mt: 1 }}>
                No schedule data available for this {ownerType}.
            </Alert>
        );
    }

    // ─── Render timeline ──────────────────────────────────────────────

    return (
        <Box sx={{
            bgcolor: '#1a1a2e',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #2a2a3a',
        }}>
            {eventDays.map((day, dayIdx) => {
                const acts = day.activities || [];
                const window = dayTimeWindow(acts);
                const hasTimedActivities = window != null;

                return (
                    <Box key={day.id}>
                        {dayIdx > 0 && <Divider sx={{ borderColor: '#2a2a3a' }} />}

                        {/* Day header */}
                        <Box sx={{
                            px: 2,
                            py: 1.5,
                            bgcolor: dayIdx === 0 ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}>
                            <DayIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                                {day.name}
                            </Typography>
                            {acts.length > 0 && (
                                <Chip
                                    label={`${acts.length} activities`}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: 'rgba(139, 92, 246, 0.15)',
                                        color: '#a78bfa',
                                    }}
                                />
                            )}
                        </Box>

                        {/* ── Visual timeline bar ── */}
                        {hasTimedActivities && acts.length > 0 && (
                            <Box sx={{ px: 2, pt: 0.5, pb: 1.5 }}>
                                {/* Time axis labels */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontFamily: 'monospace' }}>
                                        {formatTime(`${Math.floor(window!.minMin / 60)}:${String(window!.minMin % 60).padStart(2, '0')}`)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.55rem', color: '#64748b', fontFamily: 'monospace' }}>
                                        {formatTime(`${Math.floor(window!.maxMin / 60)}:${String(window!.maxMin % 60).padStart(2, '0')}`)}
                                    </Typography>
                                </Box>
                                {/* Activity colored bars */}
                                <Box sx={{
                                    position: 'relative',
                                    height: 24,
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    {acts.map((act, i) => {
                                        const s = parseMinutes(act.start_time);
                                        const e = parseMinutes(act.end_time);
                                        if (s == null) return null;
                                        const end = e ?? s + 30;
                                        const span = window!.maxMin - window!.minMin;
                                        const left = ((s - window!.minMin) / span) * 100;
                                        const width = Math.max(((end - s) / span) * 100, 2);
                                        const color = act.color || ACTIVITY_COLORS[(act.order_index ?? i) % ACTIVITY_COLORS.length];
                                        return (
                                            <Tooltip key={act.id} title={`${act.name} ${timeRange(act.start_time, act.end_time)}`} placement="top" arrow>
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 2, bottom: 2,
                                                    left: `${left}%`,
                                                    width: `${width}%`,
                                                    bgcolor: color,
                                                    borderRadius: 0.5,
                                                    opacity: 0.85,
                                                    transition: 'opacity 0.15s',
                                                    cursor: 'default',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    px: 0.5,
                                                    overflow: 'hidden',
                                                    '&:hover': { opacity: 1 },
                                                }}>
                                                    <Typography sx={{ fontSize: '0.5rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {act.name}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        {/* Activity details list */}
                        {showDetails && acts.length > 0 && (
                            <Stack spacing={0} sx={{ px: 2, pb: 1.5 }}>
                                {acts.map((activity, actIdx) => {
                                    const color = activity.color || ACTIVITY_COLORS[(activity.order_index ?? actIdx) % ACTIVITY_COLORS.length];
                                    return (
                                        <Box
                                            key={activity.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1.5,
                                                py: 1,
                                                pl: 1,
                                                borderLeft: `2px solid ${color}40`,
                                                ml: 1,
                                                '&:first-of-type': { pt: 1.5 },
                                            }}
                                        >
                                            {/* Color dot + Time column */}
                                            <Box sx={{ minWidth: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                                {(activity.start_time || activity.end_time) ? (
                                                    <Typography variant="caption" sx={{ color: '#64b5f6', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                                        {timeRange(activity.start_time, activity.end_time)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: '#4b5563', fontSize: '0.65rem' }}>
                                                        TBD
                                                    </Typography>
                                                )}
                                            </Box>

                                            {/* Activity info */}
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 500 }}>
                                                    {activity.name}
                                                </Typography>
                                                {activity.description && (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.25 }}>
                                                        {activity.description}
                                                    </Typography>
                                                )}

                                                {/* Moments */}
                                                {activity.moments && activity.moments.length > 0 && (
                                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
                                                        {activity.moments.map(mom => (
                                                            <Chip
                                                                key={mom.id}
                                                                label={mom.name}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    height: 18,
                                                                    fontSize: '0.6rem',
                                                                    borderColor: `${color}40`,
                                                                    color: '#94a3b8',
                                                                    borderRadius: 0.5,
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}

                        {/* Compact mode: just show day without activity details */}
                        {!showDetails && acts.length > 0 && (
                            <Box sx={{ px: 2, pb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {acts.map(a => a.name).join(' · ')}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
