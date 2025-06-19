'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Tabs,
    Tab,
    Stack,
    Breadcrumbs,
    Link as MuiLink,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Comment as CommentIcon,
    AccessTime as TimeIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import Link from 'next/link';

// Types
interface TaskDetail {
    id: number;
    project_id: number;
    build_component_id: number;
    task_template_id: number;
    planned_duration_hours: number;
    actual_duration_hours?: number;
    status: 'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived';
    due_date?: string;
    assigned_to_contributor_id?: number;
    is_client_visible: boolean;
    rate_at_time_of_assignment: number;
    created_at: string;
    updated_at: string;
    task_template: {
        id: number;
        name: string;
        phase?: string;
        effort_hours?: number;
        pricing_type?: string;
    };
    assigned_to_contributor?: {
        id: number;
        contact: {
            first_name: string;
            last_name: string;
            email?: string;
        };
    };
    project: {
        id: number;
        project_name?: string;
        client: {
            contact: {
                first_name: string;
                last_name: string;
            };
        };
    };
    build_component: {
        id: number;
        coverage_scene: {
            name: string;
        };
        editing_style: {
            name: string;
        };
        build_deliverable: {
            deliverable: {
                name: string;
            };
        };
    };
    _count: {
        task_comments: number;
        task_dependencies_blocking: number;
    };
}

interface TaskComment {
    id: number;
    content: string;
    created_at: string;
    contributor: {
        contact: {
            first_name: string;
            last_name: string;
        };
    };
}

interface TimeEntry {
    id: number;
    hours: number;
    description?: string;
    date: string;
    contributor: {
        contact: {
            first_name: string;
            last_name: string;
        };
    };
}

const STATUS_CONFIG = {
    To_Do: { title: 'To Do', color: 'default' as const },
    Ready_to_Start: { title: 'Ready to Start', color: 'info' as const },
    In_Progress: { title: 'In Progress', color: 'warning' as const },
    Completed: { title: 'Completed', color: 'success' as const },
    Archived: { title: 'Archived', color: 'default' as const },
};

const PRIORITY_CONFIG = {
    Low: { color: 'success' as const, icon: '🟢' },
    Medium: { color: 'warning' as const, icon: '🟡' },
    High: { color: 'error' as const, icon: '🔴' },
    Critical: { color: 'error' as const, icon: '🚨' },
};

export default function TaskDetailPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = parseInt(params.id as string);

    const [task, setTask] = useState<TaskDetail | null>(null);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        status: 'To_Do' as const,
        planned_duration_hours: 0,
        due_date: '',
        priority: 'Medium' as const,
        is_client_visible: false,
    });

    // Comment form
    const [newComment, setNewComment] = useState('');
    const [addingComment, setAddingComment] = useState(false);

    // Time tracking
    const [timeDialogOpen, setTimeDialogOpen] = useState(false);
    const [newTimeEntry, setNewTimeEntry] = useState({
        hours: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    // Fetch task details
    const fetchTaskDetails = async () => {
        try {
            const response = await fetch(`http://localhost:3002/tasks/${taskId}`);
            if (!response.ok) throw new Error('Failed to fetch task details');

            const taskData = await response.json();
            setTask(taskData);

            // Set edit form with current values
            setEditForm({
                title: taskData.task_template.name,
                description: taskData.description || '',
                status: taskData.status,
                planned_duration_hours: taskData.planned_duration_hours,
                due_date: taskData.due_date ? taskData.due_date.split('T')[0] : '',
                priority: taskData.priority || 'Medium',
                is_client_visible: taskData.is_client_visible,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
    };

    // Fetch comments
    const fetchComments = async () => {
        try {
            const response = await fetch(`http://localhost:3002/tasks/${taskId}/comments`);
            if (response.ok) {
                const commentsData = await response.json();
                setComments(commentsData);
            }
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        }
    };

    // Fetch time entries
    const fetchTimeEntries = async () => {
        try {
            const response = await fetch(`http://localhost:3002/tasks/${taskId}/time`);
            if (response.ok) {
                const timeData = await response.json();
                setTimeEntries(timeData);
            }
        } catch (err) {
            console.error('Failed to fetch time entries:', err);
        }
    };

    // Load all data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchTaskDetails(),
                fetchComments(),
                fetchTimeEntries(),
            ]);
            setLoading(false);
        };

        if (taskId) {
            loadData();
        }
    }, [taskId]);

    // Handle task update
    const handleSaveTask = async () => {
        setSaving(true);
        try {
            const response = await fetch(`http://localhost:3002/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
                }),
            });

            if (!response.ok) throw new Error('Failed to update task');

            await fetchTaskDetails();
            setEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task');
        } finally {
            setSaving(false);
        }
    };

    // Handle comment submission
    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setAddingComment(true);
        try {
            const response = await fetch(`http://localhost:3002/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });

            if (!response.ok) throw new Error('Failed to add comment');

            setNewComment('');
            await fetchComments();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        } finally {
            setAddingComment(false);
        }
    };

    // Handle time entry
    const handleAddTimeEntry = async () => {
        if (newTimeEntry.hours <= 0) return;

        try {
            const response = await fetch(`http://localhost:3002/tasks/${taskId}/time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newTimeEntry,
                    date: new Date(newTimeEntry.date).toISOString(),
                }),
            });

            if (!response.ok) throw new Error('Failed to add time entry');

            setNewTimeEntry({
                hours: 0,
                description: '',
                date: new Date().toISOString().split('T')[0],
            });
            setTimeDialogOpen(false);
            await Promise.all([fetchTimeEntries(), fetchTaskDetails()]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add time entry');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
                <Button variant="outlined" onClick={() => router.back()}>
                    Go Back
                </Button>
            </Box>
        );
    }

    if (!task) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">Task not found</Alert>
                <Button variant="outlined" onClick={() => router.back()} sx={{ mt: 2 }}>
                    Go Back
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link href="/app-crm" passHref legacyBehavior>
                        <MuiLink underline="hover" color="inherit">
                            Dashboard
                        </MuiLink>
                    </Link>
                    <Link href="/app-crm/tasks" passHref legacyBehavior>
                        <MuiLink underline="hover" color="inherit">
                            Tasks
                        </MuiLink>
                    </Link>
                    <Typography color="text.primary">Task #{task.id}</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => router.back()}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" component="h1">
                            {task.task_template.name}
                        </Typography>
                        <Chip
                            label={STATUS_CONFIG[task.status].title}
                            color={STATUS_CONFIG[task.status].color}
                            size="small"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {editing ? (
                            <>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSaveTask}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<CancelIcon />}
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => setEditing(true)}
                            >
                                Edit Task
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            {/* Task Overview */}
                            <Typography variant="h6" gutterBottom>
                                Task Details
                            </Typography>

                            {editing ? (
                                <Stack spacing={2}>
                                    <TextField
                                        label="Title"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Description"
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        multiline
                                        rows={3}
                                        fullWidth
                                    />
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Status</InputLabel>
                                                <Select
                                                    value={editForm.status}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as 'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived' }))}
                                                    label="Status"
                                                >
                                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                        <MenuItem key={key} value={key}>
                                                            {config.title}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Priority</InputLabel>
                                                <Select
                                                    value={editForm.priority}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical' }))}
                                                    label="Priority"
                                                >
                                                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                                        <MenuItem key={key} value={key}>
                                                            {config.icon} {key}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Planned Hours"
                                                type="number"
                                                value={editForm.planned_duration_hours}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, planned_duration_hours: parseFloat(e.target.value) || 0 }))}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Due Date"
                                                type="date"
                                                value={editForm.due_date}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Stack>
                            ) : (
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="body1" color="text.secondary" gutterBottom>
                                            Project: {task.project.project_name} • Client: {task.project.client?.contact?.first_name} {task.project.client?.contact?.last_name}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" gutterBottom>
                                            Component: {task.build_component?.coverage_scene?.name || 'N/A'} • {task.build_component?.editing_style?.name || 'N/A'}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" gutterBottom>
                                            Deliverable: {task.build_component?.build_deliverable?.deliverable?.name || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Planned Duration
                                        </Typography>
                                        <Typography variant="body1">
                                            {task.planned_duration_hours}h
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Actual Duration
                                        </Typography>
                                        <Typography variant="body1">
                                            {task.actual_duration_hours || 0}h
                                        </Typography>
                                    </Grid>
                                    {task.due_date && (
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Due Date
                                            </Typography>
                                            <Typography variant="body1">
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {task.assigned_to_contributor && (
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Assigned To
                                            </Typography>
                                            <Typography variant="body1">
                                                {task.assigned_to_contributor.contact.first_name} {task.assigned_to_contributor.contact.last_name}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs for Comments and Time Tracking */}
                    <Card>
                        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                            <Tab label={`Comments (${comments.length})`} icon={<CommentIcon />} />
                            <Tab label={`Time Entries (${timeEntries.length})`} icon={<TimeIcon />} />
                        </Tabs>

                        <CardContent>
                            {activeTab === 0 && (
                                <Box>
                                    {/* Add Comment */}
                                    <Box sx={{ mb: 3 }}>
                                        <TextField
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            multiline
                                            rows={2}
                                            fullWidth
                                            sx={{ mb: 1 }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim() || addingComment}
                                            size="small"
                                        >
                                            {addingComment ? 'Adding...' : 'Add Comment'}
                                        </Button>
                                    </Box>

                                    {/* Comments List */}
                                    <List>
                                        {comments.map((comment) => (
                                            <ListItem key={comment.id} alignItems="flex-start">
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        {comment.contributor.contact.first_name[0]}
                                                        {comment.contributor.contact.last_name[0]}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="subtitle2">
                                                                {comment.contributor.contact.first_name} {comment.contributor.contact.last_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(comment.created_at).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={comment.content}
                                                />
                                            </ListItem>
                                        ))}
                                        {comments.length === 0 && (
                                            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                                No comments yet
                                            </Typography>
                                        )}
                                    </List>
                                </Box>
                            )}

                            {activeTab === 1 && (
                                <Box>
                                    {/* Add Time Entry */}
                                    <Box sx={{ mb: 3 }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => setTimeDialogOpen(true)}
                                        >
                                            Log Time
                                        </Button>
                                    </Box>

                                    {/* Time Entries List */}
                                    <List>
                                        {timeEntries.map((entry) => (
                                            <ListItem key={entry.id}>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <TimeIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="subtitle2">
                                                                {entry.hours}h
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                by {entry.contributor.contact.first_name} {entry.contributor.contact.last_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(entry.date).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondary={entry.description}
                                                />
                                            </ListItem>
                                        ))}
                                        {timeEntries.length === 0 && (
                                            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                                No time entries yet
                                            </Typography>
                                        )}
                                    </List>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={2}>
                        {/* Quick Stats */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Quick Stats
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Progress
                                        </Typography>
                                        <Typography variant="h6">
                                            {task.actual_duration_hours ? Math.round((task.actual_duration_hours / task.planned_duration_hours) * 100) : 0}%
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Remaining
                                        </Typography>
                                        <Typography variant="h6">
                                            {Math.max(0, task.planned_duration_hours - (task.actual_duration_hours || 0))}h
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Comments
                                        </Typography>
                                        <Typography variant="h6">
                                            {task._count?.task_comments ?? 0}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">
                                            Dependencies
                                        </Typography>
                                        <Typography variant="h6">
                                            {task._count?.task_dependencies_blocking ?? 0}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Task Meta */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Task Information
                                </Typography>
                                <Stack spacing={1}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Created
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(task.created_at).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(task.updated_at).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Template
                                        </Typography>
                                        <Typography variant="body2">
                                            {task.task_template.name} ({task.task_template.phase})
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Client Visible
                                        </Typography>
                                        <Chip
                                            label={task.is_client_visible ? 'Yes' : 'No'}
                                            size="small"
                                            color={task.is_client_visible ? 'success' : 'default'}
                                        />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            {/* Time Entry Dialog */}
            <Dialog open={timeDialogOpen} onClose={() => setTimeDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Log Time Entry</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Hours"
                            type="number"
                            value={newTimeEntry.hours}
                            onChange={(e) => setNewTimeEntry(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                            inputProps={{ min: 0, step: 0.25 }}
                            fullWidth
                        />
                        <TextField
                            label="Date"
                            type="date"
                            value={newTimeEntry.date}
                            onChange={(e) => setNewTimeEntry(prev => ({ ...prev, date: e.target.value }))}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Description (optional)"
                            value={newTimeEntry.description}
                            onChange={(e) => setNewTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                            multiline
                            rows={2}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTimeDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddTimeEntry} disabled={newTimeEntry.hours <= 0}>
                        Log Time
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
