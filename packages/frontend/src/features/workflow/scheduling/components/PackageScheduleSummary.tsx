'use client';

/**
 * PackageScheduleSummary — compact read-only summary of a package's schedule template.
 *
 * Shows aggregate counts (event days, activities, crew, subjects, locations, films)
 * and event day names as chips. Fetches data from the package summary endpoint.
 *
 * Used in NeedsAssessmentCard when a package is selected, to give a quick preview
 * of the schedule structure before the inquiry's instance schedule is cloned.
 */

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Chip, Stack, Skeleton, Alert,
} from '@mui/material';
import {
    CalendarToday as DayIcon,
    Schedule as ActivityIcon,
    Person as CrewIcon,
    People as SubjectIcon,
    Place as LocationIcon,
    CameraRoll as FilmIcon,
} from '@mui/icons-material';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────

interface PackageScheduleSummaryData {
    package_id: number;
    package_name: string;
    package_description: string | null;
    has_schedule_data: boolean;
    counts: {
        event_days: number;
        activities: number;
        moments: number;
        subjects: number;
        location_slots: number;
        operators: number;
        films: number;
    };
    event_day_names: string[];
}

interface PackageScheduleSummaryProps {
    packageId: number;
    /** Compact mode: show just the essentials in a row */
    compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────

export default function PackageScheduleSummary({ packageId, compact = false }: PackageScheduleSummaryProps) {
    const [data, setData] = useState<PackageScheduleSummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        api.schedule.packageSummary.get(packageId)
            .then((res: PackageScheduleSummaryData) => {
                if (!cancelled) setData(res);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || 'Failed to load schedule summary');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [packageId]);

    // ─── Loading ──────────────────────────────────────────────────────

    if (loading) {
        return (
            <Box sx={{ mt: 1 }}>
                <Skeleton variant="rounded" height={compact ? 32 : 64} />
            </Box>
        );
    }

    // ─── Error ────────────────────────────────────────────────────────

    if (error) {
        return (
            <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
                Could not load schedule preview
            </Alert>
        );
    }

    // ─── No schedule data ─────────────────────────────────────────────

    if (!data || !data.has_schedule_data) {
        return (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                No schedule template configured for this package
            </Typography>
        );
    }

    const { counts, event_day_names } = data;

    // ─── Stat items to show ───────────────────────────────────────────

    const stats = [
        { icon: <DayIcon sx={{ fontSize: 14 }} />, label: 'Days', value: counts.event_days },
        { icon: <ActivityIcon sx={{ fontSize: 14 }} />, label: 'Activities', value: counts.activities },
        { icon: <CrewIcon sx={{ fontSize: 14 }} />, label: 'Crew', value: counts.operators },
        { icon: <SubjectIcon sx={{ fontSize: 14 }} />, label: 'Subjects', value: counts.subjects },
        { icon: <LocationIcon sx={{ fontSize: 14 }} />, label: 'Locations', value: counts.location_slots },
    ];

    // Only show films if > 0
    if (counts.films > 0) {
        stats.push({ icon: <FilmIcon sx={{ fontSize: 14 }} />, label: 'Films', value: counts.films });
    }

    // ─── Compact mode ─────────────────────────────────────────────────

    if (compact) {
        return (
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                {stats.filter(s => s.value > 0).map(s => (
                    <Chip
                        key={s.label}
                        icon={s.icon}
                        label={`${s.value} ${s.label}`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 1, fontSize: '0.7rem' }}
                    />
                ))}
            </Box>
        );
    }

    // ─── Full mode ────────────────────────────────────────────────────

    return (
        <Box sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: 'rgba(255,255,255,0.03)',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
        }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                SCHEDULE TEMPLATE
            </Typography>

            {/* Day names */}
            {event_day_names.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {event_day_names.map((name, i) => (
                            <Chip
                                key={i}
                                icon={<DayIcon sx={{ fontSize: 12 }} />}
                                label={name}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ borderRadius: 1, fontSize: '0.7rem' }}
                            />
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Stats row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {stats.filter(s => s.value > 0).map(s => (
                    <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {s.icon}
                        <Typography variant="caption" color="text.secondary">
                            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', mr: 0.25 }}>{s.value}</Box>
                            {s.label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
