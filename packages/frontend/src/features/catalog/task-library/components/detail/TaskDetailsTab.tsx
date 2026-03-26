"use client";

import React from 'react';
import {
    Grid, Paper, Typography, Stack, TextField, FormControl, InputLabel,
    Select, MenuItem, FormControlLabel, Switch, Divider, Box, Chip,
} from '@mui/material';
import {
    Assignment as TaskIcon, Timer as TimerIcon, AttachMoney as MoneyIcon, Speed as SpeedIcon,
} from '@mui/icons-material';
import { ProjectPhase, PricingType, PHASE_LABELS, PRICING_TYPE_LABELS } from '@/lib/types';
import type { TaskLibrary } from '@/lib/types';
import type { TaskFormData } from '../../hooks/use-task-detail';

interface Props {
    task: TaskLibrary | null;
    formData: TaskFormData;
    isEditing: boolean;
    validationErrors: Record<string, string>;
    currencyCode: string;
    formatMoney: (v: number) => string;
    onFormChange: (field: keyof TaskFormData, value: unknown) => void;
}

export function TaskDetailsTab({ task, formData, isEditing, validationErrors, currencyCode, formatMoney, onFormChange }: Props) {
    return (
        <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TaskIcon color="primary" fontSize="small" /> Basic Information
                    </Typography>
                    <Stack spacing={2}>
                        <TextField label="Task Name" value={formData.name || ''} onChange={e => onFormChange('name', e.target.value)}
                            fullWidth required disabled={!isEditing} size="small" helperText="Descriptive name for the task"
                            error={!!validationErrors.name} />
                        <TextField label="Description" value={formData.description || ''} onChange={e => onFormChange('description', e.target.value)}
                            fullWidth multiline rows={3} disabled={!isEditing} size="small" helperText="Detailed description of the task" />
                        <FormControl fullWidth disabled={!isEditing} size="small">
                            <InputLabel>Project Phase</InputLabel>
                            <Select value={formData.phase || ProjectPhase.LEAD} onChange={e => onFormChange('phase', e.target.value)} label="Project Phase">
                                {Object.values(ProjectPhase).map(p => <MenuItem key={p} value={p}>{PHASE_LABELS[p]}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControlLabel control={<Switch checked={formData.is_active ?? true} onChange={e => onFormChange('is_active', e.target.checked)} disabled={!isEditing} />}
                            label="Task is Active" />
                    </Stack>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TimerIcon color="primary" fontSize="small" /> Effort & Timing
                    </Typography>
                    <Stack spacing={2}>
                        <TextField label="Effort Hours" type="number" value={formData.effort_hours ?? 0} onChange={e => onFormChange('effort_hours', parseFloat(e.target.value) || 0)}
                            fullWidth disabled={!isEditing} size="small" inputProps={{ min: 0, step: 0.5 }} helperText="Estimated time to complete" error={!!validationErrors.effort_hours} />
                        {task?.recorded_hours && (
                            <TextField label="Recorded Hours" value={task.recorded_hours} fullWidth disabled size="small" helperText="Actual time recorded" />
                        )}
                        <Divider />
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Performance Metrics</Typography>
                            <Chip icon={<SpeedIcon />}
                                label={task?.recorded_hours && (formData.effort_hours ?? 0) > 0 ? `${Math.round((task.recorded_hours / (formData.effort_hours ?? 1)) * 100)}% of estimated` : 'No data'}
                                color={task?.recorded_hours && (formData.effort_hours ?? 0) > 0 && task.recorded_hours <= (formData.effort_hours ?? 0) ? 'success' : 'default'}
                                variant="outlined" size="small" />
                        </Box>
                    </Stack>
                </Paper>
            </Grid>
            <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <MoneyIcon color="primary" fontSize="small" /> Pricing Configuration
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth disabled={!isEditing} size="small">
                                <InputLabel>Pricing Type</InputLabel>
                                <Select value={formData.pricing_type || PricingType.HOURLY} onChange={e => onFormChange('pricing_type', e.target.value)} label="Pricing Type">
                                    {Object.values(PricingType).map(t => <MenuItem key={t} value={t}>{PRICING_TYPE_LABELS[t]}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        {(formData.pricing_type || PricingType.HOURLY) === PricingType.FIXED && (
                            <Grid item xs={12} md={4}>
                                <TextField label="Fixed Price ($)" type="number" value={formData.fixed_price ?? 0} onChange={e => onFormChange('fixed_price', parseFloat(e.target.value) || 0)}
                                    fullWidth disabled={!isEditing} size="small" inputProps={{ min: 0, step: 0.01 }} error={!!validationErrors.fixed_price} helperText={validationErrors.fixed_price} />
                            </Grid>
                        )}
                        {(formData.pricing_type || PricingType.HOURLY) === PricingType.HOURLY && (
                            <Grid item xs={12} md={4}>
                                <TextField label={`Hourly Rate (${currencyCode})`} type="number" value={formData.hourly_rate ?? 0} onChange={e => onFormChange('hourly_rate', parseFloat(e.target.value) || 0)}
                                    fullWidth disabled={!isEditing} size="small" inputProps={{ min: 0, step: 0.01 }} error={!!validationErrors.hourly_rate} helperText={validationErrors.hourly_rate} />
                            </Grid>
                        )}
                        <Grid item xs={12} md={4}>
                            <TextField label={`Estimated Value (${currencyCode})`}
                                value={(formData.pricing_type || PricingType.HOURLY) === PricingType.FIXED ? formatMoney(formData.fixed_price || 0) : formatMoney((formData.hourly_rate || 0) * (formData.effort_hours || 0))}
                                fullWidth disabled size="small" helperText="Calculated based on pricing type" />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );
}
