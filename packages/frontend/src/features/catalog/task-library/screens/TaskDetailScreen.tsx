"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, Card, CardContent, CircularProgress,
    Avatar, IconButton, Stack, Chip, Tabs, Tab, Breadcrumbs, Link,
    Snackbar, Alert, keyframes,
} from '@mui/material';
import {
    ArrowBack as BackIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon,
    Assignment as TaskIcon, CheckCircle as ActiveIcon, Timer as TimerIcon,
    AttachMoney as MoneyIcon, Settings as SettingsIcon, Work as WorkIcon,
    Warning as WarningIcon, Analytics as AnalyticsIcon, Info as InfoIcon,
} from '@mui/icons-material';
import { ProjectPhase, PricingType, PHASE_LABELS, PRICING_TYPE_LABELS } from '@/lib/types';
import { formatCurrency as formatCurrencyHelper } from '@/lib/utils/formatUtils';
import { useTheme } from '@/shared/theme';
import { useBrand } from '@/app/providers/BrandProvider';
import { useTaskDetail } from '../hooks/use-task-detail';
import { TaskDetailsTab } from '../components/detail/TaskDetailsTab';
import { TaskPerformanceTab } from '../components/detail/TaskPerformanceTab';

const pulseAnimation = keyframes`0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}`;

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
    return <div role="tabpanel" hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>;
}

interface Props { taskId: string; }

export function TaskDetailScreen({ taskId }: Props) {
    const router = useRouter();
    const { mode } = useTheme();
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency || 'USD';
    const formatMoney = (v: number) => formatCurrencyHelper(v, currencyCode);

    const {
        task, loading, saving, autoSaving, isEditing, setIsEditing, error,
        tabValue, handleTabChange, validationErrors, hasUnsavedChanges,
        snackbar, setSnackbar, formData, handleFormChange, handleSave, handleCancel, isNewTask,
    } = useTaskDetail(taskId);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Box>;

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                    <IconButton onClick={() => router.push('/manager/tasks')}><BackIcon /></IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{isNewTask ? 'Create Task' : 'Task Details'}</Typography>
                        <Typography variant="body1" color="text.secondary">{isNewTask ? 'Define a new task for your workflow' : 'Manage task settings, pricing, and benchmarks'}</Typography>
                    </Box>
                </Box>
                <Breadcrumbs>
                    <Link underline="hover" color="inherit" href="/manager" sx={{ display: 'flex', alignItems: 'center' }}>
                        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Management
                    </Link>
                    <Link underline="hover" color="inherit" href="/manager/tasks" sx={{ display: 'flex', alignItems: 'center' }}>
                        <TaskIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Tasks Library
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>{task?.name || 'New Task'}</Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ p: 3 }}>
                <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${mode === 'dark' ? '#1a1a1a' : '#ffffff'} 0%, ${mode === 'dark' ? '#2d2d2d' : '#f8f9fa'} 100%)`, border: `1px solid ${mode === 'dark' ? '#333' : '#e0e0e0'}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '1.8rem', fontWeight: 700, animation: autoSaving ? `${pulseAnimation} 1s infinite` : 'none' }}>
                                {(task?.name || 'NT').substring(0, 2).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{task?.name || 'New Task'}</Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                    {PHASE_LABELS[formData.phase || ProjectPhase.LEAD]} • {PRICING_TYPE_LABELS[formData.pricing_type || PricingType.HOURLY]}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip icon={formData.is_active ? <ActiveIcon /> : <CancelIcon />} label={formData.is_active ? 'Active' : 'Inactive'} color={formData.is_active ? 'success' : 'error'} size="small" sx={{ fontWeight: 600 }} />
                                    <Chip icon={<TimerIcon />} label={`${formData.effort_hours ?? 0}h`} color="primary" size="small" sx={{ fontWeight: 600 }} />
                                    <Chip icon={<MoneyIcon />} label={formData.pricing_type === PricingType.FIXED ? formatMoney(formData.fixed_price || 0) : `${formatMoney(formData.hourly_rate || 0)}/hr`} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                    <Chip icon={<WorkIcon />} label={PHASE_LABELS[formData.phase || ProjectPhase.LEAD]} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                </Stack>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                {hasUnsavedChanges && <Chip icon={<WarningIcon />} label="Unsaved changes" color="warning" size="small" sx={{ fontWeight: 600 }} />}
                                {autoSaving && <Chip icon={<CircularProgress size={12} />} label="Auto-saving..." color="info" size="small" sx={{ fontWeight: 600 }} />}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {isEditing ? (
                                    <>
                                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} disabled={saving} size="small">Cancel</Button>
                                        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />} onClick={handleSave} disabled={saving} size="small">{saving ? 'Saving...' : (isNewTask ? 'Create' : 'Save')}</Button>
                                    </>
                                ) : (
                                    <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)} size="small">Edit Task</Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', py: 2 } }}>
                    <Tab label="Task Details" icon={<InfoIcon />} iconPosition="start" />
                    <Tab label="Performance" icon={<AnalyticsIcon />} iconPosition="start" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <TaskDetailsTab task={task} formData={formData} isEditing={isEditing} validationErrors={validationErrors}
                        currencyCode={currencyCode} formatMoney={formatMoney} onFormChange={handleFormChange} />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <TaskPerformanceTab task={task} formData={formData} />
                </TabPanel>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
                <Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
