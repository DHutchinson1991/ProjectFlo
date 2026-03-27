"use client";

import React from 'react';
import {
    Box, Grid, Paper, Typography, Stack,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon, Group as GroupIcon, Analytics as AnalyticsIcon, Star as StarIcon,
} from '@mui/icons-material';
import type { TaskLibrary } from '@/features/catalog/task-library/types';
import type { TaskFormData } from '../../hooks/use-task-detail';

interface Props {
    task: TaskLibrary | null;
    formData: TaskFormData;
}

export function TaskPerformanceTab({ task, formData }: Props) {
    const effortHours = formData.effort_hours ?? 0;
    const efficiency = task?.recorded_hours && effortHours > 0
        ? (task.recorded_hours <= effortHours ? 'Excellent' : 'Needs Improvement') : 'No Data';

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <TrendingUpIcon color="primary" fontSize="small" /> Performance Overview
                        </Typography>
                        <Stack spacing={2}>
                            {([
                                ['Estimated Hours', `${effortHours}h`],
                                ['Recorded Hours', `${task?.recorded_hours || 0}h`],
                            ] as [string, string][]).map(([label, value]) => (
                                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{value}</Typography>
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Efficiency Rating</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StarIcon color={efficiency === 'Excellent' ? 'warning' : 'disabled'} fontSize="small" />
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{efficiency}</Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <GroupIcon color="primary" fontSize="small" /> Team Benchmarks
                        </Typography>
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <AnalyticsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>Benchmark Analytics</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Compare performance across team members and projects.
                            </Typography>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Coming Soon</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
