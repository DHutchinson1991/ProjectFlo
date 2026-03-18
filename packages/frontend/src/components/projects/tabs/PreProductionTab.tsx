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
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    CheckCircle as TaskIcon,
    Schedule as ScheduleIcon,
    Assignment as DocumentIcon,
    Group as TeamIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Project } from '../../../app/(studio)/projects/types/project.types';

interface PreProductionTask {
    id: number;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    category: 'planning' | 'logistics' | 'equipment' | 'timeline' | 'permits' | 'team';
    assigned_to?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
}

interface PreProductionTabProps {
    project: Project;
    onRefresh: () => void;
}

const TASK_CATEGORIES = {
    planning: { label: 'Planning & Coordination', icon: <DocumentIcon />, color: '#8b5cf6' },
    logistics: { label: 'Logistics', icon: <LocationIcon />, color: '#06b6d4' },
    equipment: { label: 'Equipment Prep', icon: <TaskIcon />, color: '#10b981' },
    timeline: { label: 'Timeline & Schedule', icon: <ScheduleIcon />, color: '#f59e0b' },
    permits: { label: 'Permits & Legal', icon: <DocumentIcon />, color: '#ef4444' },
    team: { label: 'Team Coordination', icon: <TeamIcon />, color: '#6366f1' },
};

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#6b7280' },
    in_progress: { label: 'In Progress', color: '#f59e0b' },
    completed: { label: 'Completed', color: '#10b981' },
    blocked: { label: 'Blocked', color: '#ef4444' },
};

export default function PreProductionTab({ project, onRefresh }: PreProductionTabProps) {
    const [tasks, setTasks] = useState<PreProductionTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        category: 'planning' as keyof typeof TASK_CATEGORIES,
        status: 'pending' as keyof typeof STATUS_CONFIG,
        assigned_to: '',
        due_date: '',
    });

    useEffect(() => {
        fetchTasks();
    }, [project.id]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            // Mock data for now - replace with actual API call
            const mockTasks: PreProductionTask[] = [
                {
                    id: 1,
                    title: 'Venue Site Visit',
                    description: 'Visit wedding venue to scout locations and understand logistics',
                    status: 'completed',
                    category: 'planning',
                    assigned_to: 'John Doe',
                    due_date: '2024-02-01',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-28T14:30:00Z',
                },
                {
                    id: 2,
                    title: 'Equipment Check & Prep',
                    description: 'Inventory and test all cameras, lenses, audio equipment, and accessories',
                    status: 'in_progress',
                    category: 'equipment',
                    assigned_to: 'Sarah Wilson',
                    due_date: '2024-02-10',
                    created_at: '2024-01-20T09:00:00Z',
                    updated_at: '2024-02-05T11:00:00Z',
                },
                {
                    id: 3,
                    title: 'Timeline Creation',
                    description: 'Create detailed timeline for wedding day filming schedule',
                    status: 'pending',
                    category: 'timeline',
                    assigned_to: 'Mike Johnson',
                    due_date: '2024-02-15',
                    created_at: '2024-02-01T16:00:00Z',
                    updated_at: '2024-02-01T16:00:00Z',
                },
                {
                    id: 4,
                    title: 'Drone Flight Permits',
                    description: 'Obtain necessary permits for drone photography at venue',
                    status: 'blocked',
                    category: 'permits',
                    assigned_to: 'Legal Team',
                    due_date: '2024-02-20',
                    created_at: '2024-01-25T10:00:00Z',
                    updated_at: '2024-02-03T15:00:00Z',
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
            const newPreProductionTask: PreProductionTask = {
                id: Math.max(...tasks.map(task => task.id)) + 1,
                title: newTask.title,
                description: newTask.description,
                status: newTask.status,
                category: newTask.category,
                assigned_to: newTask.assigned_to,
                due_date: newTask.due_date,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setTasks(prev => [...prev, newPreProductionTask]);
            setNewTask({
                title: '',
                description: '',
                category: 'planning',
                status: 'pending',
                assigned_to: '',
                due_date: '',
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
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        return Math.round((completedTasks / tasks.length) * 100);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No due date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDaysUntilDue = (dateString?: string) => {
        if (!dateString) return null;
        const dueDate = new Date(dateString);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

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
                            <TaskIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 28 }} />
                            Pre-Production Progress
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

                    <Grid container spacing={2}>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                            const count = tasks.filter(task => task.status === status).length;
                            return (
                                <Grid item xs={6} sm={3} key={status}>
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
                            Add New Pre-Production Task
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
                            <Grid item xs={12} sm={6}>
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
                                        Category
                                    </TableCell>
                                    <TableCell sx={{ color: '#d1d5db', fontWeight: 600, border: 'none' }}>
                                        Assigned To
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
                                {tasks.map((task) => {
                                    const daysUntilDue = getDaysUntilDue(task.due_date);
                                    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                                    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

                                    return (
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
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ border: 'none' }}>
                                                <Chip
                                                    icon={TASK_CATEGORIES[task.category].icon}
                                                    label={TASK_CATEGORIES[task.category].label}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${TASK_CATEGORIES[task.category].color}20`,
                                                        color: TASK_CATEGORIES[task.category].color,
                                                        border: `1px solid ${TASK_CATEGORIES[task.category].color}40`,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ border: 'none' }}>
                                                <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                                                    {task.assigned_to || 'Unassigned'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ border: 'none' }}>
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#d1d5db',
                                                            fontWeight: isOverdue || isDueSoon ? 600 : 400,
                                                        }}
                                                    >
                                                        {formatDate(task.due_date)}
                                                    </Typography>
                                                    {daysUntilDue !== null && (
                                                        <Typography variant="caption" sx={{
                                                            color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#9ca3af'
                                                        }}>
                                                            {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                                                                daysUntilDue === 0 ? 'Due today' :
                                                                    `${daysUntilDue} days left`}
                                                        </Typography>
                                                    )}
                                                </Box>
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
                                                    {task.status !== 'completed' && (
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
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}
