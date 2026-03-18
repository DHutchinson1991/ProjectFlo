import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    TextField,
    Chip,
    IconButton,
    Stack,
    LinearProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Edit as PostProductionIcon,
    Movie as VideoIcon,
    AudioFile as AudioIcon,
    ColorLens as ColorIcon,
    Speed as EffectsIcon,
    CloudUpload as ExportIcon,
} from '@mui/icons-material';
import { Project } from '../../../app/(studio)/projects/types/project.types';

interface PostProductionTask {
    id: number;
    title: string;
    description?: string;
    task_type: 'editing' | 'color_grading' | 'audio_mixing' | 'effects' | 'export' | 'review';
    status: 'not_started' | 'in_progress' | 'review' | 'completed' | 'approved';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: string;
    estimated_hours?: number;
    actual_hours?: number;
    due_date?: string;
    notes?: string;
    files_involved?: string[];
    created_at: string;
    updated_at: string;
}

interface PostProductionTabProps {
    project: Project;
    onRefresh: () => void;
}

const TASK_TYPES = {
    editing: { label: 'Video Editing', icon: <VideoIcon />, color: '#8b5cf6' },
    color_grading: { label: 'Color Grading', icon: <ColorIcon />, color: '#06b6d4' },
    audio_mixing: { label: 'Audio Mixing', icon: <AudioIcon />, color: '#10b981' },
    effects: { label: 'Effects & Graphics', icon: <EffectsIcon />, color: '#f59e0b' },
    export: { label: 'Export & Delivery', icon: <ExportIcon />, color: '#ef4444' },
    review: { label: 'Review & Feedback', icon: <CheckIcon />, color: '#6366f1' },
};

const STATUS_CONFIG = {
    not_started: { label: 'Not Started', color: '#6b7280' },
    in_progress: { label: 'In Progress', color: '#f59e0b' },
    review: { label: 'Under Review', color: '#8b5cf6' },
    completed: { label: 'Completed', color: '#10b981' },
    approved: { label: 'Approved', color: '#3b82f6' },
};

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: '#6b7280' },
    medium: { label: 'Medium', color: '#f59e0b' },
    high: { label: 'High', color: '#ef4444' },
    urgent: { label: 'Urgent', color: '#dc2626' },
};

export default function PostProductionTab({ project }: PostProductionTabProps) {
    const [tasks, setTasks] = useState<PostProductionTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        task_type: 'editing' as keyof typeof TASK_TYPES,
        status: 'not_started' as keyof typeof STATUS_CONFIG,
        priority: 'medium' as keyof typeof PRIORITY_CONFIG,
        assigned_to: '',
        estimated_hours: '',
        due_date: '',
        notes: '',
    });

    useEffect(() => {
        fetchTasks();
    }, [project.id]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            // Mock data for now - replace with actual API call
            const mockTasks: PostProductionTask[] = [
                {
                    id: 1,
                    title: 'Initial Video Edit',
                    description: 'Create first cut of wedding video with basic timeline',
                    task_type: 'editing',
                    status: 'in_progress',
                    priority: 'high',
                    assigned_to: 'John Editor',
                    estimated_hours: 20,
                    actual_hours: 12,
                    due_date: '2024-04-01',
                    notes: 'Focus on ceremony and key reception moments',
                    files_involved: ['ceremony_raw.mp4', 'reception_raw.mp4'],
                    created_at: '2024-03-15T10:00:00Z',
                    updated_at: '2024-03-20T14:30:00Z',
                },
                {
                    id: 2,
                    title: 'Color Correction',
                    description: 'Color grading for consistent look across all footage',
                    task_type: 'color_grading',
                    status: 'not_started',
                    priority: 'medium',
                    assigned_to: 'Sarah Colorist',
                    estimated_hours: 8,
                    due_date: '2024-04-05',
                    notes: 'Match lighting conditions between indoor and outdoor shots',
                    files_involved: ['edited_timeline.prproj'],
                    created_at: '2024-03-18T09:00:00Z',
                    updated_at: '2024-03-18T09:00:00Z',
                },
                {
                    id: 3,
                    title: 'Audio Enhancement',
                    description: 'Clean up audio, sync vows, add background music',
                    task_type: 'audio_mixing',
                    status: 'completed',
                    priority: 'high',
                    assigned_to: 'Mike Audio',
                    estimated_hours: 6,
                    actual_hours: 7,
                    due_date: '2024-03-25',
                    notes: 'Vows audio cleaned up successfully',
                    files_involved: ['vows_audio.wav', 'ceremony_ambient.wav'],
                    created_at: '2024-03-16T14:00:00Z',
                    updated_at: '2024-03-25T16:00:00Z',
                },
                {
                    id: 4,
                    title: 'Final Export',
                    description: 'Export final video in multiple formats for delivery',
                    task_type: 'export',
                    status: 'not_started',
                    priority: 'medium',
                    assigned_to: 'John Editor',
                    estimated_hours: 2,
                    due_date: '2024-04-10',
                    notes: 'Export: 4K, 1080p, and web-optimized versions',
                    created_at: '2024-03-20T11:00:00Z',
                    updated_at: '2024-03-20T11:00:00Z',
                },
            ];
            setTasks(mockTasks);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async () => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            const newPostProductionTask: PostProductionTask = {
                id: Math.max(...tasks.map(task => task.id)) + 1,
                title: newTask.title,
                description: newTask.description,
                task_type: newTask.task_type,
                status: newTask.status,
                priority: newTask.priority,
                assigned_to: newTask.assigned_to,
                estimated_hours: newTask.estimated_hours ? parseInt(newTask.estimated_hours) : undefined,
                due_date: newTask.due_date,
                notes: newTask.notes,
                files_involved: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setTasks(prev => [...prev, newPostProductionTask]);
            setNewTask({
                title: '',
                description: '',
                task_type: 'editing',
                status: 'not_started',
                priority: 'medium',
                assigned_to: '',
                estimated_hours: '',
                due_date: '',
                notes: '',
            });
            setShowAddForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add task');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (taskId: number, newStatus: keyof typeof STATUS_CONFIG) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setTasks(prev =>
                prev.map(task =>
                    task.id === taskId
                        ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
                        : task
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            setLoading(true);
            // Mock API call - replace with actual API
            setTasks(prev => prev.filter(task => task.id !== taskId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete task');
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = () => {
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(task =>
            task.status === 'completed' || task.status === 'approved'
        ).length;
        return Math.round((completedTasks / tasks.length) * 100);
    };

    const getTotalHours = () => {
        const estimated = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
        const actual = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
        return { estimated, actual };
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No due date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const { estimated, actual } = getTotalHours();

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {error}
                </Alert>
            )}

            {/* Progress Overview */}
            <Card sx={{
                mb: 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                border: '1px solid rgba(52, 58, 68, 0.3)',
                background: 'rgba(16, 18, 22, 0.95)',
                backdropFilter: 'blur(10px)'
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center' }}>
                            <PostProductionIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                            Post-Production Progress
                        </Typography>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => setShowAddForm(true)}
                            variant="contained"
                            sx={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                '&:hover': {
                                    background: 'rgba(59, 130, 246, 0.3)',
                                },
                            }}
                        >
                            Add Task
                        </Button>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={8}>
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                        Overall Progress
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                        {getProgressPercentage()}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={getProgressPercentage()}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'rgba(75, 85, 99, 0.3)',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#10b981',
                                            borderRadius: 4,
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
                                    Hours Tracked
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#f3f4f6', fontWeight: 700 }}>
                                    {actual}h / {estimated}h
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: actual > estimated ? '#ef4444' : '#10b981'
                                }}>
                                    {actual > estimated ? 'Over estimate' : 'On track'}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                            const count = tasks.filter(task => task.status === status).length;
                            return (
                                <Grid item xs={6} sm={2.4} key={status}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h6" sx={{ color: config.color, fontWeight: 700 }}>
                                            {count}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                                            {config.label}
                                        </Typography>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </CardContent>
            </Card>

            {/* Add New Task Form */}
            {showAddForm && (
                <Card sx={{
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                    background: 'rgba(16, 18, 22, 0.95)',
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ color: '#f3f4f6', mb: 3 }}>
                            Add New Post-Production Task
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Task Title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                    fullWidth
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#9ca3af', '&.Mui-focused': { color: '#d1d5db' } }}>
                                        Task Type
                                    </InputLabel>
                                    <Select
                                        value={newTask.task_type}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, task_type: e.target.value as keyof typeof TASK_TYPES }))}
                                        label="Task Type"
                                        sx={{
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                            '& .MuiSelect-select': {
                                                color: '#f3f4f6'
                                            }
                                        }}
                                    >
                                        {Object.entries(TASK_TYPES).map(([type, config]) => (
                                            <MenuItem key={type} value={type}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Assigned To"
                                    value={newTask.assigned_to}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Estimated Hours"
                                    type="number"
                                    value={newTask.estimated_hours}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: e.target.value }))}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="Due Date"
                                    type="date"
                                    value={newTask.due_date}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                                    fullWidth
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(75, 85, 99, 0.6)',
                                            },
                                        },
                                        '& .MuiInputLabel-root': { color: '#9ca3af' },
                                        '& .MuiInputBase-input': { color: '#f3f4f6' }
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                startIcon={<SaveIcon />}
                                onClick={handleAddTask}
                                disabled={!newTask.title || loading}
                                variant="contained"
                                sx={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                            >
                                Save Task
                            </Button>
                            <Button
                                startIcon={<CancelIcon />}
                                onClick={() => setShowAddForm(false)}
                                variant="outlined"
                                sx={{
                                    borderColor: 'rgba(239, 68, 68, 0.4)',
                                    color: '#ef4444',
                                }}
                            >
                                Cancel
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {/* Tasks Table */}
            <Card sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(52, 58, 68, 0.3)',
                background: 'rgba(16, 18, 22, 0.95)',
            }}>
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Task
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Assigned To
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Priority
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Due Date
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Status
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.id} sx={{ '&:hover': { backgroundColor: 'rgba(75, 85, 99, 0.1)' } }}>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Box>
                                                <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                                    {task.title}
                                                </Typography>
                                                {task.description && (
                                                    <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
                                                        {task.description}
                                                    </Typography>
                                                )}
                                                {task.estimated_hours && (
                                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                                        Est: {task.estimated_hours}h
                                                        {task.actual_hours && ` | Actual: ${task.actual_hours}h`}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                icon={TASK_TYPES[task.task_type].icon}
                                                label={TASK_TYPES[task.task_type].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${TASK_TYPES[task.task_type].color}20`,
                                                    color: TASK_TYPES[task.task_type].color,
                                                    border: `1px solid ${TASK_TYPES[task.task_type].color}40`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                                {task.assigned_to || 'Unassigned'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                label={PRIORITY_CONFIG[task.priority].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${PRIORITY_CONFIG[task.priority].color}20`,
                                                    color: PRIORITY_CONFIG[task.priority].color,
                                                    border: `1px solid ${PRIORITY_CONFIG[task.priority].color}40`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                                {formatDate(task.due_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Chip
                                                label={STATUS_CONFIG[task.status].label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${STATUS_CONFIG[task.status].color}20`,
                                                    color: STATUS_CONFIG[task.status].color,
                                                    border: `1px solid ${STATUS_CONFIG[task.status].color}40`,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }}>
                                            <Stack direction="row" spacing={1}>
                                                {task.status !== 'completed' && task.status !== 'approved' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleUpdateStatus(task.id, 'completed')}
                                                        sx={{ color: '#10b981' }}
                                                    >
                                                        <CheckIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#9ca3af' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    sx={{ color: '#ef4444' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}
