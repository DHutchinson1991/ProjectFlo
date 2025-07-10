"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    Grid,
    Switch,
    FormControlLabel,
    Avatar,
    IconButton,
    Stack,
    Chip,
    Tabs,
    Tab,
    Breadcrumbs,
    Link,
    Paper,
    keyframes,
    Divider,
} from "@mui/material";
import {
    ArrowBack as BackIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Assignment as TaskIcon,
    CheckCircle as ActiveIcon,
    Timer as TimerIcon,
    AttachMoney as MoneyIcon,
    Settings as SettingsIcon,
    Analytics as AnalyticsIcon,
    Info as InfoIcon,
    Work as WorkIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    Speed as SpeedIcon,
    Star as StarIcon,
    Group as GroupIcon,
} from "@mui/icons-material";
import { api } from "@/lib/api";
import {
    TaskLibrary,
    ProjectPhase,
    PricingType,
    PHASE_LABELS,
    PRICING_TYPE_LABELS
} from "@/lib/types";
import { useTheme } from "@/app/theme/ThemeProvider";

// Animation keyframes for visual feedback
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Define interfaces for type safety
interface ValidationErrors {
    [key: string]: string;
}

// Form data interface with all required fields
interface TaskFormData {
    name: string;
    description: string;
    effort_hours: number;
    phase: ProjectPhase;
    pricing_type: PricingType;
    fixed_price: number;
    hourly_rate: number;
    is_active: boolean;
}

// Helper component for Tabs
interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`task-tabpanel-${index}`}
            aria-labelledby={`task-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

// Helper functions for displaying task data
function getTaskInitials(task: TaskLibrary | null): string {
    if (!task) return 'T';
    return task.name.substring(0, 2).toUpperCase();
}

function getTaskDisplayName(task: TaskLibrary | null): string {
    if (!task) return 'New Task';
    return task.name;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

// Main component
export default function TaskEditPage() {
    // Hooks
    const router = useRouter();
    const params = useParams();
    const { mode } = useTheme();
    const taskId = params.id as string;
    const isNewTask = taskId === 'new';
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State
    const [task, setTask] = useState<TaskLibrary | null>(null);
    const [loading, setLoading] = useState(!isNewTask);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(isNewTask);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'info' | 'warning'
    });

    // Form state
    const [formData, setFormData] = useState<TaskFormData>({
        name: '',
        description: '',
        effort_hours: 0,
        phase: ProjectPhase.LEAD,
        pricing_type: PricingType.HOURLY,
        fixed_price: 0,
        hourly_rate: 0,
        is_active: true,
    });

    // Effect to load task data on component mount
    useEffect(() => {
        if (isNewTask) {
            setLoading(false);
            return;
        }

        const loadTask = async () => {
            try {
                setLoading(true);
                const taskData = await api.taskLibrary.getById(parseInt(taskId));
                setTask(taskData);
                setFormData({
                    name: taskData.name,
                    description: taskData.description || '',
                    effort_hours: taskData.effort_hours,
                    phase: taskData.phase,
                    pricing_type: taskData.pricing_type,
                    fixed_price: taskData.fixed_price || 0,
                    hourly_rate: taskData.hourly_rate || 0,
                    is_active: taskData.is_active,
                });
            } catch (err) {
                setError('Failed to load task');
                console.error('Error loading task:', err);
            } finally {
                setLoading(false);
            }
        };

        loadTask();
    }, [taskId, isNewTask]);

    // Handler for tab changes
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Auto-save functionality
    const handleAutoSave = useCallback(async (data: TaskFormData) => {
        if (isNewTask || !isEditing) return;
        try {
            setAutoSaving(true);
            await api.taskLibrary.update(parseInt(taskId), data);
            setHasUnsavedChanges(false);
            setSnackbar({ open: true, message: 'Changes saved automatically', severity: 'info' });
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setAutoSaving(false);
        }
    }, [taskId, isNewTask, isEditing]);

    // Form change handler with validation and auto-save trigger
    const handleFormChange = useCallback((field: keyof TaskFormData, value: unknown) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (validationErrors[field]) {
                setValidationErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors[field];
                    return newErrors;
                });
            }

            setHasUnsavedChanges(true);

            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

            if (!isNewTask && isEditing) {
                autoSaveTimeoutRef.current = setTimeout(() => {
                    handleAutoSave(newData);
                }, 2000);
            }

            return newData;
        });
    }, [validationErrors, isNewTask, isEditing, handleAutoSave]);

    // Form validation logic
    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors = {};
        if (!formData.name?.trim()) errors.name = 'Task name is required';
        if ((formData.effort_hours ?? 0) < 0) errors.effort_hours = 'Effort hours must be positive';
        if (formData.pricing_type === PricingType.FIXED && !(formData.fixed_price ?? 0)) {
            errors.fixed_price = 'Fixed price is required for fixed pricing';
        }
        if (formData.pricing_type === PricingType.HOURLY && !(formData.hourly_rate ?? 0)) {
            errors.hourly_rate = 'Hourly rate is required for hourly pricing';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Manual save handler
    const handleSave = async () => {
        if (!validateForm()) {
            setSnackbar({ open: true, message: 'Please fix the validation errors before saving', severity: 'error' });
            return;
        }

        try {
            setSaving(true);
            if (isNewTask) {
                const newTask = await api.taskLibrary.create(formData);
                setSnackbar({ open: true, message: 'Task created successfully', severity: 'success' });
                router.push(`/manager/tasks/${newTask.id}`);
            } else {
                const updatedTask = await api.taskLibrary.update(parseInt(taskId), formData);
                setTask(updatedTask);
                setSnackbar({ open: true, message: 'Task updated successfully', severity: 'success' });
                setIsEditing(false);
                setHasUnsavedChanges(false);
            }
        } catch (err) {
            setSnackbar({ open: true, message: isNewTask ? 'Failed to create task' : 'Failed to update task', severity: 'error' });
            console.error('Error saving task:', err);
        } finally {
            setSaving(false);
        }
    };

    // Cancel edit handler
    const handleCancel = () => {
        if (isNewTask) {
            router.push('/manager/tasks');
        } else {
            setIsEditing(false);
            if (task) {
                // Reset form to original data
                setFormData({
                    name: task.name,
                    description: task.description || '',
                    effort_hours: task.effort_hours,
                    phase: task.phase,
                    pricing_type: task.pricing_type,
                    fixed_price: task.fixed_price || 0,
                    hourly_rate: task.hourly_rate || 0,
                    is_active: task.is_active,
                });
            }
            setHasUnsavedChanges(false);
        }
    };

    // Loading and Error states
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Box>;

    return (
        <Box sx={{ minHeight: "100vh" }}>
            {/* Header Section */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
                    <IconButton onClick={() => router.push("/manager/tasks")}>
                        <BackIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {isNewTask ? 'Create Task' : 'Task Details'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {isNewTask ? 'Define a new task for your workflow' : 'Manage task settings, pricing, and benchmarks'}
                        </Typography>
                    </Box>
                </Box>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/manager" sx={{ display: "flex", alignItems: "center" }}>
                        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Management
                    </Link>
                    <Link underline="hover" color="inherit" href="/manager/tasks" sx={{ display: "flex", alignItems: "center" }}>
                        <TaskIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Tasks Library
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                        {getTaskDisplayName(task)}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Main Content */}
            <Box sx={{ p: 3 }}>
                {/* Identity Bar Card */}
                <Card sx={{
                    mb: 3,
                    background: `linear-gradient(135deg, ${mode === "dark" ? "#1a1a1a" : "#ffffff"} 0%, ${mode === "dark" ? "#2d2d2d" : "#f8f9fa"} 100%)`,
                    border: `1px solid ${mode === "dark" ? "#333" : "#e0e0e0"}`,
                    boxShadow: `0 4px 20px ${mode === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {/* Task Icon */}
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        bgcolor: "primary.main",
                                        fontSize: "1.8rem",
                                        fontWeight: 700,
                                        transition: 'all 0.3s ease',
                                        animation: autoSaving ? `${pulseAnimation} 1s infinite` : 'none'
                                    }}
                                >
                                    {getTaskInitials(task)}
                                </Avatar>
                            </Box>

                            {/* Task Info */}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {getTaskDisplayName(task)}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                    {PHASE_LABELS[formData.phase || ProjectPhase.LEAD]} • {PRICING_TYPE_LABELS[formData.pricing_type || PricingType.HOURLY]}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                                    <Chip
                                        icon={(formData.is_active ?? true) ? <ActiveIcon /> : <CancelIcon />}
                                        label={(formData.is_active ?? true) ? 'Active' : 'Inactive'}
                                        color={(formData.is_active ?? true) ? 'success' : 'error'}
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Chip
                                        icon={<TimerIcon />}
                                        label={`${formData.effort_hours ?? 0}h`}
                                        color="primary"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Chip
                                        icon={<MoneyIcon />}
                                        label={(formData.pricing_type || PricingType.HOURLY) === PricingType.FIXED
                                            ? formatCurrency(formData.fixed_price || 0)
                                            : `${formatCurrency(formData.hourly_rate || 0)}/hr`
                                        }
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Chip
                                        icon={<WorkIcon />}
                                        label={PHASE_LABELS[formData.phase || ProjectPhase.LEAD]}
                                        variant="outlined"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                </Box>
                            </Box>

                            {/* Status Indicators */}
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                {hasUnsavedChanges && (
                                    <Chip
                                        icon={<WarningIcon />}
                                        label="Unsaved changes"
                                        color="warning"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                                {autoSaving && (
                                    <Chip
                                        icon={<CircularProgress size={12} />}
                                        label="Auto-saving..."
                                        color="info"
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    {task?.recorded_hours ? 'Recorded Hours' : 'Created'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {task?.recorded_hours
                                        ? `${task.recorded_hours}h`
                                        : (task ? formatDate(task.created_at) : 'New')
                                    }
                                </Typography>
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ display: "flex", gap: 1 }}>
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outlined"
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancel}
                                            disabled={saving}
                                            size="small"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                                            onClick={handleSave}
                                            disabled={saving}
                                            size="small"
                                        >
                                            {saving ? 'Saving...' : (isNewTask ? 'Create' : 'Save')}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="contained"
                                        startIcon={<EditIcon />}
                                        onClick={() => setIsEditing(true)}
                                        size="small"
                                    >
                                        Edit Task
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Box>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            borderBottom: 1,
                            borderColor: "divider",
                            "& .MuiTab-root": {
                                fontWeight: 600,
                                textTransform: "none",
                                py: 2,
                                fontSize: "0.9rem"
                            }
                        }}
                    >
                        <Tab label="Task Details" icon={<InfoIcon />} iconPosition="start" />
                        <Tab label="Performance" icon={<AnalyticsIcon />} iconPosition="start" />
                    </Tabs>

                    {/* Tab 1: Task Details Form */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3} sx={{ p: 3 }}>
                            <Grid item xs={12} md={6}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mb: 2
                                        }}
                                    >
                                        <TaskIcon color="primary" fontSize="small" /> Basic Information
                                    </Typography>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Task Name"
                                            value={formData.name || ''}
                                            onChange={(e) => handleFormChange('name', e.target.value)}
                                            fullWidth
                                            required
                                            disabled={!isEditing}
                                            size="small"
                                            helperText="Descriptive name for the task"
                                            error={!!validationErrors.name}
                                        />
                                        <TextField
                                            label="Description"
                                            value={formData.description || ''}
                                            onChange={(e) => handleFormChange('description', e.target.value)}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            disabled={!isEditing}
                                            size="small"
                                            helperText="Detailed description of the task"
                                        />
                                        <FormControl fullWidth disabled={!isEditing} size="small">
                                            <InputLabel>Project Phase</InputLabel>
                                            <Select
                                                value={formData.phase || ProjectPhase.LEAD}
                                                onChange={(e) => handleFormChange('phase', e.target.value)}
                                                label="Project Phase"
                                            >
                                                {Object.values(ProjectPhase).map((phase) => (
                                                    <MenuItem key={phase} value={phase}>
                                                        {PHASE_LABELS[phase]}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.is_active ?? true}
                                                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                                                    disabled={!isEditing}
                                                />
                                            }
                                            label="Task is Active"
                                        />
                                    </Stack>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mb: 2
                                        }}
                                    >
                                        <TimerIcon color="primary" fontSize="small" /> Effort & Timing
                                    </Typography>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Effort Hours"
                                            type="number"
                                            value={formData.effort_hours ?? 0}
                                            onChange={(e) => handleFormChange('effort_hours', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            disabled={!isEditing}
                                            size="small"
                                            inputProps={{ min: 0, step: 0.5 }}
                                            helperText="Estimated time to complete"
                                            error={!!validationErrors.effort_hours}
                                        />
                                        {task?.recorded_hours && (
                                            <TextField
                                                label="Recorded Hours"
                                                value={task.recorded_hours}
                                                fullWidth
                                                disabled
                                                size="small"
                                                helperText="Actual time recorded"
                                            />
                                        )}
                                        <Divider />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                                Performance Metrics
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Chip
                                                    icon={<SpeedIcon />}
                                                    label={task?.recorded_hours && (formData.effort_hours ?? 0) > 0
                                                        ? `${Math.round((task.recorded_hours / (formData.effort_hours ?? 1)) * 100)}% of estimated`
                                                        : 'No data'
                                                    }
                                                    color={task?.recorded_hours && (formData.effort_hours ?? 0) > 0 && task.recorded_hours <= (formData.effort_hours ?? 0) ? 'success' : 'default'}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mb: 2
                                        }}
                                    >
                                        <MoneyIcon color="primary" fontSize="small" /> Pricing Configuration
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth disabled={!isEditing} size="small">
                                                <InputLabel>Pricing Type</InputLabel>
                                                <Select
                                                    value={formData.pricing_type || PricingType.HOURLY}
                                                    onChange={(e) => handleFormChange('pricing_type', e.target.value)}
                                                    label="Pricing Type"
                                                >
                                                    {Object.values(PricingType).map((type) => (
                                                        <MenuItem key={type} value={type}>
                                                            {PRICING_TYPE_LABELS[type]}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        {(formData.pricing_type || PricingType.HOURLY) === PricingType.FIXED && (
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    label="Fixed Price ($)"
                                                    type="number"
                                                    value={formData.fixed_price ?? 0}
                                                    onChange={(e) => handleFormChange('fixed_price', parseFloat(e.target.value) || 0)}
                                                    fullWidth
                                                    disabled={!isEditing}
                                                    size="small"
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                    error={!!validationErrors.fixed_price}
                                                    helperText={validationErrors.fixed_price}
                                                />
                                            </Grid>
                                        )}
                                        {(formData.pricing_type || PricingType.HOURLY) === PricingType.HOURLY && (
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    label="Hourly Rate ($)"
                                                    type="number"
                                                    value={formData.hourly_rate ?? 0}
                                                    onChange={(e) => handleFormChange('hourly_rate', parseFloat(e.target.value) || 0)}
                                                    fullWidth
                                                    disabled={!isEditing}
                                                    size="small"
                                                    inputProps={{ min: 0, step: 0.01 }}
                                                    error={!!validationErrors.hourly_rate}
                                                    helperText={validationErrors.hourly_rate}
                                                />
                                            </Grid>
                                        )}
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label="Estimated Value ($)"
                                                value={(formData.pricing_type || PricingType.HOURLY) === PricingType.FIXED
                                                    ? formatCurrency(formData.fixed_price || 0)
                                                    : formatCurrency((formData.hourly_rate || 0) * (formData.effort_hours || 0))
                                                }
                                                fullWidth
                                                disabled
                                                size="small"
                                                helperText="Calculated based on pricing type"
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 2: Performance Analytics */}
                    <TabPanel value={tabValue} index={1}>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                mb: 2
                                            }}
                                        >
                                            <TrendingUpIcon color="primary" fontSize="small" /> Performance Overview
                                        </Typography>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Estimated Hours
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {formData.effort_hours ?? 0}h
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Recorded Hours
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {task?.recorded_hours || 0}h
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Efficiency Rating
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <StarIcon
                                                        color={task?.recorded_hours && (formData.effort_hours ?? 0) > 0 && task.recorded_hours <= (formData.effort_hours ?? 0) ? 'warning' : 'disabled'}
                                                        fontSize="small"
                                                    />
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {task?.recorded_hours && formData.effort_hours > 0
                                                            ? (task.recorded_hours <= formData.effort_hours ? 'Excellent' : 'Needs Improvement')
                                                            : 'No Data'
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "divider" }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                mb: 2
                                            }}
                                        >
                                            <GroupIcon color="primary" fontSize="small" /> Team Benchmarks
                                        </Typography>
                                        <Box sx={{ textAlign: 'center', py: 3 }}>
                                            <AnalyticsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                Benchmark Analytics
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                                Compare performance across team members and projects.
                                            </Typography>
                                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                                Coming Soon
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </TabPanel>
                </Box>
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
