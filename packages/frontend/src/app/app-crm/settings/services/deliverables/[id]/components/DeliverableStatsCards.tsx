import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
    AccessTime as AccessTimeIcon,
    AttachMoney as AttachMoneyIcon,
    Schedule as ScheduleIcon,
    Engineering as WorkIcon
} from '@mui/icons-material';
import { VisualTemplate } from './types';

interface DeliverableStatsCardsProps {
    visualTemplate: VisualTemplate;
    deliveryTimeline: number;
}

export default function DeliverableStatsCards({
    visualTemplate,
    deliveryTimeline
}: DeliverableStatsCardsProps) {
    // Calculate stats from visual template
    const duration = visualTemplate.totalDuration;
    const totalHours = visualTemplate.totalHours;
    const cost = visualTemplate.estimatedCost;

    return (
        <Grid container spacing={4} sx={{ mb: 3 }}>
            {/* Overview Section */}
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        Overview
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <AccessTimeIcon color="primary" sx={{ fontSize: 28, mb: 1 }} />
                            <Typography variant="h6">{duration} min</Typography>
                            <Typography variant="body2" color="text.secondary">Duration</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <AttachMoneyIcon color="success" sx={{ fontSize: 28, mb: 1 }} />
                            <Typography variant="h6">${cost.toFixed(2)}</Typography>
                            <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>

            {/* Workflow Section */}
            <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        Workflow
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <WorkIcon color="secondary" sx={{ fontSize: 28, mb: 1 }} />
                            <Typography variant="h6">{totalHours.toFixed(1)} hrs</Typography>
                            <Typography variant="body2" color="text.secondary">Total Hours</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <ScheduleIcon color="info" sx={{ fontSize: 28, mb: 1 }} />
                            <Typography variant="h6">{deliveryTimeline || 'N/A'}</Typography>
                            <Typography variant="body2" color="text.secondary">Days Timeline</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}
