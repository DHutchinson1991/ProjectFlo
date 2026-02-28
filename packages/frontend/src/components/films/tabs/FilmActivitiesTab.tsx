'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Stack, Divider,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityRecord {
    id: number;
    package_id: number;
    package_event_day_id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    order_index: number;
}

interface PackageEventDay {
    id: number;        // event_day_template id
    name: string;
    _joinId?: number;  // PackageEventDay join record id
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTimeToMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

function formatTimeDisplay(time: string | null | undefined): string {
    if (!time) return '';
    const mins = parseTimeToMinutes(time);
    if (mins === null) return time;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDuration(mins: number): string {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getActivityDuration(act: ActivityRecord): number {
    if (act.duration_minutes && act.duration_minutes > 0) return act.duration_minutes;
    if (act.start_time && act.end_time) {
        const s = parseTimeToMinutes(act.start_time);
        const e = parseTimeToMinutes(act.end_time);
        if (s !== null && e !== null && e > s) return e - s;
    }
    return 0;
}

function sortByTime(activities: ActivityRecord[]): ActivityRecord[] {
    return [...activities].sort((a, b) => {
        const aMin = parseTimeToMinutes(a.start_time);
        const bMin = parseTimeToMinutes(b.start_time);
        if (aMin === null && bMin === null) return a.order_index - b.order_index;
        if (aMin === null) return 1;
        if (bMin === null) return -1;
        return aMin - bMin;
    });
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FilmActivitiesTabProps {
    packageId?: number | null;
}

export const FilmActivitiesTab: React.FC<FilmActivitiesTabProps> = ({ packageId }) => {
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [eventDays, setEventDays] = useState<PackageEventDay[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!packageId) return;

        let mounted = true;
        setLoading(true);
        setError(null);

        Promise.all([
            api.schedule.packageActivities.getAll(packageId),
            api.schedule.packageEventDays.getAll(packageId),
        ])
            .then(([acts, days]) => {
                if (!mounted) return;
                setActivities(acts || []);
                setEventDays(days || []);
            })
            .catch(() => {
                if (mounted) setError('Failed to load activities');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [packageId]);

    if (!packageId) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info" icon={<EventNoteIcon />}>
                    This film isn&apos;t linked to a package. Open it from the Package Library to see the schedule here.
                </Alert>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;
    }

    if (activities.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">No activities scheduled yet. Add activities from the Package page.</Alert>
            </Box>
        );
    }

    // Group activities by their package_event_day_id, map to day names
    const dayMap = new Map<number, string>();
    eventDays.forEach(d => {
        const joinId = d._joinId ?? d.id;
        dayMap.set(joinId, d.name);
    });

    // Build groups: { dayName, activities }
    const groups = new Map<number, ActivityRecord[]>();
    activities.forEach(act => {
        const list = groups.get(act.package_event_day_id) ?? [];
        list.push(act);
        groups.set(act.package_event_day_id, list);
    });

    const groupEntries = Array.from(groups.entries()).map(([joinId, acts]) => ({
        joinId,
        dayName: dayMap.get(joinId) ?? 'Day',
        activities: sortByTime(acts),
    }));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {groupEntries.map(({ joinId, dayName, activities: dayActs }) => (
                <Box key={joinId}>
                    {/* Day header */}
                    <Box sx={{ px: 1, pb: 0.5 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#94a3b8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontWeight: 600,
                                fontSize: '0.68rem',
                            }}
                        >
                            {dayName}
                        </Typography>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 0.5 }} />

                    {/* Activity rows */}
                    <Stack spacing={0.5}>
                        {dayActs.map(act => {
                            const duration = getActivityDuration(act);
                            const dotColor = act.color || '#648CFF';
                            return (
                                <Box
                                    key={act.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        px: 1.5,
                                        py: 0.75,
                                        borderRadius: 1.5,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    {/* Color dot */}
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: dotColor,
                                            flexShrink: 0,
                                        }}
                                    />

                                    {/* Name */}
                                    <Typography
                                        sx={{
                                            flex: 1,
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: '#e2e8f0',
                                            minWidth: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {act.name}
                                    </Typography>

                                    {/* Time range */}
                                    {(act.start_time || act.end_time) && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <AccessTimeIcon sx={{ fontSize: '0.75rem', color: '#64748b' }} />
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {formatTimeDisplay(act.start_time)}
                                                {act.end_time && ` – ${formatTimeDisplay(act.end_time)}`}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Duration */}
                                    {duration > 0 && (
                                        <Typography
                                            sx={{
                                                fontSize: '0.7rem',
                                                color: '#64748b',
                                                flexShrink: 0,
                                                minWidth: 28,
                                                textAlign: 'right',
                                            }}
                                        >
                                            {formatDuration(duration)}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            ))}
        </Box>
    );
};
