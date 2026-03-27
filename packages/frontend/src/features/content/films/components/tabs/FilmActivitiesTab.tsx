'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Stack, Divider,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { scheduleApi } from '@/features/workflow/scheduling/api';
import {
    type ActivityRecord, type PackageEventDay,
    formatTimeDisplay, formatDuration, getActivityDuration, sortByTime,
} from '../../utils/activity-time-helpers';

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
            scheduleApi.packageActivities.getAll(packageId),
            scheduleApi.packageEventDays.getAll(packageId),
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
