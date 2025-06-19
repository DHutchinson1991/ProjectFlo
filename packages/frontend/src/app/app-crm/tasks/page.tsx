'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
    Fab,
    IconButton,
    Tooltip,
    Badge,
    Avatar,
    CardActions,
    Menu,
    Stack,
    Breadcrumbs,
    Link as MuiLink,
    Switch,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    FilterList as FilterIcon,
    ViewKanban as ViewKanbanIcon,
    ViewList as ViewListIcon,
    Assignment as AssignmentIcon,
    Schedule as ScheduleIcon,
    Comment as CommentIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Flag as FlagIcon,
} from '@mui/icons-material';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

// Types
interface Task {
    id: number;
    status: 'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived';
    planned_duration_hours: number;
    actual_duration_hours?: number;
    due_date?: string;
    is_client_visible: boolean;
    task_template: {
        id: number;
        name: string;
        phase?: string;
    };
    assigned_to_contributor?: {
        id: number;
        contact: {
            first_name: string;
            last_name: string;
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
    _count: {
        task_comments: number;
        task_dependencies_blocking: number;
    };
}

interface BoardData {
    board: {
        To_Do: Task[];
        Ready_to_Start: Task[];
        In_Progress: Task[];
        Completed: Task[];
        Archived: Task[];
    };
    summary: {
        total: number;
        by_status: {
            to_do: number;
            ready_to_start: number;
            in_progress: number;
            completed: number;
            archived: number;
        };
        overdue: number;
    };
}

interface TaskTemplate {
    id: number;
    name: string;
    phase?: string;
    effort_hours?: number;
}

interface Project {
    id: number;
    project_name?: string;
    client?: {
        contact: {
            first_name: string;
            last_name: string;
        };
    };
}

interface BuildComponent {
    id: number;
    coverage_scene: {
        name: string;
    };
    editing_style: {
        name: string;
    };
    build_deliverable: {
        build: {
            id: number;
        };
        deliverable: {
            name: string;
        };
    };
}

interface CreateTaskFormData {
    project_id: number;
    build_component_id: number;
    task_template_id: number;
    title?: string;
    description?: string;
    planned_duration_hours?: number;
    due_date?: string;
    assigned_to_contributor_id?: number;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    is_client_visible?: boolean;
}

const STATUS_CONFIG = {
    To_Do: {
        title: 'To Do',
        color: 'default' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        headerColor: 'rgba(255, 255, 255, 0.7)',
    },
    Ready_to_Start: {
        title: 'Ready to Start',
        color: 'info' as const,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        headerColor: '#60a5fa',
    },
    In_Progress: {
        title: 'In Progress',
        color: 'warning' as const,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        headerColor: '#fbbf24',
    },
    Completed: {
        title: 'Completed',
        color: 'success' as const,
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
        headerColor: '#4ade80',
    },
    Archived: {
        title: 'Archived',
        color: 'default' as const,
        backgroundColor: 'rgba(107, 114, 128, 0.08)',
        borderColor: 'rgba(107, 114, 128, 0.3)',
        headerColor: 'rgba(255, 255, 255, 0.5)',
    },
};

export default function TaskBoardPage() {
    const searchParams = useSearchParams();
    const [boardData, setBoardData] = useState<BoardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Bulk operations
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkOperation, setBulkOperation] = useState<'status' | 'assignee' | 'delete'>('status');
    const [bulkStatusValue, setBulkStatusValue] = useState<'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived'>('To_Do');
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Filters
    const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
    const [assigneeFilter, setAssigneeFilter] = useState<number | 'all'>('all');
    const [projects, setProjects] = useState<Project[]>([]);

    // Create task dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
    const [buildComponents, setBuildComponents] = useState<BuildComponent[]>([]);
    const [createTaskForm, setCreateTaskForm] = useState<CreateTaskFormData>({
        project_id: 0,
        build_component_id: 0,
        task_template_id: 0,
        priority: 'Medium',
        is_client_visible: false,
    });
    const [createTaskLoading, setCreateTaskLoading] = useState(false);

    // View mode
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Fetch board data
    const fetchBoardData = async () => {
        try {
            const params = new URLSearchParams();
            if (projectFilter !== 'all') params.append('project_id', projectFilter.toString());
            if (assigneeFilter !== 'all') params.append('assigned_to', assigneeFilter.toString());

            const response = await fetch(`http://localhost:3002/tasks/board?${params}`);
            if (!response.ok) throw new Error('Failed to fetch board data');

            const data = await response.json();
            setBoardData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
    };

    // Fetch supporting data
    const fetchSupportingData = async () => {
        try {
            const [templatesResponse, projectsResponse] = await Promise.all([
                fetch('http://localhost:3002/task-templates'),
                fetch('http://localhost:3002/tasks/projects')
            ]);

            if (templatesResponse.ok) {
                const templates = await templatesResponse.json();
                setTaskTemplates(templates);
            }

            if (projectsResponse.ok) {
                const projectsData = await projectsResponse.json();
                setProjects(projectsData);
            }
        } catch (err) {
            console.error('Failed to fetch supporting data:', err);
        }
    };

    // Load data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchBoardData(), fetchSupportingData()]);
            setLoading(false);
        };

        loadData();
    }, [projectFilter, assigneeFilter]);

    // Handle drag and drop
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);

        // Find the dragged task
        if (boardData) {
            for (const status of Object.keys(boardData.board) as (keyof typeof boardData.board)[]) {
                const task = boardData.board[status].find(t => t.id.toString() === active.id);
                if (task) {
                    setDraggedTask(task);
                    break;
                }
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || !boardData) return;

        const taskId = parseInt(active.id as string);
        const newStatus = over.id as keyof typeof boardData.board;

        // Find current task and status
        let currentStatus: keyof typeof boardData.board | null = null;
        let task: Task | null = null;

        for (const status of Object.keys(boardData.board) as (keyof typeof boardData.board)[]) {
            const foundTask = boardData.board[status].find(t => t.id === taskId);
            if (foundTask) {
                task = foundTask;
                currentStatus = status;
                break;
            }
        }

        if (!task || !currentStatus || currentStatus === newStatus) {
            setActiveId(null);
            setDraggedTask(null);
            return;
        }

        // Optimistically update the UI
        const newBoardData = { ...boardData };

        // Remove task from current status
        newBoardData.board[currentStatus] = newBoardData.board[currentStatus].filter(t => t.id !== taskId);

        // Add task to new status
        const updatedTask = { ...task, status: newStatus };
        newBoardData.board[newStatus] = [...newBoardData.board[newStatus], updatedTask];

        // Update summary
        newBoardData.summary.by_status[currentStatus.toLowerCase() as keyof typeof newBoardData.summary.by_status]--;
        newBoardData.summary.by_status[newStatus.toLowerCase() as keyof typeof newBoardData.summary.by_status]++;

        setBoardData(newBoardData);

        try {
            // Update on server
            const response = await fetch(`http://localhost:3002/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
        } catch (err) {
            // Revert on error
            setBoardData(boardData);
            setError('Failed to update task status');
        }

        setActiveId(null);
        setDraggedTask(null);
    };

    // Handle project selection for build components
    const handleProjectChange = async (projectId: number) => {
        setCreateTaskForm(prev => ({ ...prev, project_id: projectId, build_component_id: 0 }));
        if (projectId > 0) {
            try {
                const response = await fetch(`http://localhost:3002/tasks/projects/${projectId}/build-components`);
                if (response.ok) {
                    const components = await response.json();
                    setBuildComponents(components);
                }
            } catch (err) {
                console.error('Failed to fetch build components:', err);
            }
        } else {
            setBuildComponents([]);
        }
    };

    // Handle task creation
    const handleCreateTask = async () => {
        if (!createTaskForm.project_id || !createTaskForm.build_component_id || !createTaskForm.task_template_id) {
            setError('Please fill in all required fields');
            return;
        }

        setCreateTaskLoading(true);
        try {
            const taskData = {
                ...createTaskForm,
                due_date: createTaskForm.due_date ? new Date(createTaskForm.due_date).toISOString() : undefined,
            };

            const response = await fetch('http://localhost:3002/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) {
                throw new Error('Failed to create task');
            }

            // Reset form and close dialog
            setCreateTaskForm({
                project_id: 0,
                build_component_id: 0,
                task_template_id: 0,
                priority: 'Medium',
                is_client_visible: false,
            });
            setCreateDialogOpen(false);
            setBuildComponents([]);

            // Refresh board data
            await fetchBoardData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create task');
        } finally {
            setCreateTaskLoading(false);
        }
    };

    // Handle bulk task selection
    const handleTaskSelect = (taskId: number, selected: boolean) => {
        const newSelected = new Set(selectedTasks);
        if (selected) {
            newSelected.add(taskId);
        } else {
            newSelected.delete(taskId);
        }
        setSelectedTasks(newSelected);
    };

    // Handle select all tasks
    const handleSelectAll = (selected: boolean) => {
        if (selected && boardData) {
            const allTaskIds = new Set<number>();
            Object.values(boardData.board).flat().forEach(task => allTaskIds.add(task.id));
            setSelectedTasks(allTaskIds);
        } else {
            setSelectedTasks(new Set());
        }
    };

    // Handle bulk operations
    const handleBulkOperation = async () => {
        if (selectedTasks.size === 0) return;

        setBulkProcessing(true);
        try {
            const taskIds = Array.from(selectedTasks);
            let updates = {};

            switch (bulkOperation) {
                case 'status':
                    updates = { status: bulkStatusValue };
                    break;
                case 'delete':
                    // Handle delete separately
                    await Promise.all(taskIds.map(id =>
                        fetch(`http://localhost:3002/tasks/${id}`, { method: 'DELETE' })
                    ));
                    setBulkDialogOpen(false);
                    setSelectedTasks(new Set());
                    await fetchBoardData();
                    return;
                default:
                    return;
            }

            const response = await fetch('http://localhost:3002/tasks/bulk-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_ids: taskIds, updates }),
            });

            if (!response.ok) throw new Error('Failed to update tasks');

            setBulkDialogOpen(false);
            setSelectedTasks(new Set());
            await fetchBoardData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to perform bulk operation');
        } finally {
            setBulkProcessing(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !boardData) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || 'Failed to load board data'}</Alert>
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
                    <Typography color="text.primary">Tasks</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        Task Board
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {/* View Mode Toggle */}
                        <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('board')}
                                color={viewMode === 'board' ? 'primary' : 'default'}
                            >
                                <ViewKanbanIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => setViewMode('list')}
                                color={viewMode === 'list' ? 'primary' : 'default'}
                            >
                                <ViewListIcon />
                            </IconButton>
                        </Box>

                        {/* Filters */}
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Project</InputLabel>
                            <Select
                                value={projectFilter}
                                label="Project"
                                onChange={(e) => setProjectFilter(e.target.value as number | 'all')}
                            >
                                <MenuItem value="all">All Projects</MenuItem>
                                {projects.map((project) => (
                                    <MenuItem key={project.id} value={project.id}>
                                        {project.project_name || `Project ${project.id}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            Add Task
                        </Button>
                    </Box>
                </Box>

                {/* Summary Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h6">{boardData.summary.total}</Typography>
                                <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h6" color="warning.main">
                                    {boardData.summary.by_status.in_progress}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">In Progress</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h6" color="success.main">
                                    {boardData.summary.by_status.completed}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Completed</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h6" color="error.main">
                                    {boardData.summary.overdue}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Overdue</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Board View */}
            {viewMode === 'board' && (
                <Box
                    sx={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        p: 3,
                        minHeight: '70vh',
                    }}
                >
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2 }}>
                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                <TaskColumn
                                    key={status}
                                    status={status as keyof typeof boardData.board}
                                    title={config.title}
                                    color={config.color}
                                    backgroundColor={config.backgroundColor}
                                    tasks={boardData.board[status as keyof typeof boardData.board]}
                                    onTaskUpdate={fetchBoardData}
                                    selectedTasks={selectedTasks}
                                    onTaskSelect={handleTaskSelect}
                                />
                            ))}
                        </Box>

                        <DragOverlay>
                            {activeId && draggedTask ? (
                                <TaskCard task={draggedTask} isDragging />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </Box>
            )}

            {/* Create Task FAB */}
            <Fab
                color="primary"
                aria-label="add task"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => setCreateDialogOpen(true)}
            >
                <AddIcon />
            </Fab>

            {/* Create Task Dialog */}
            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Create New Task</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Project Selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Project</InputLabel>
                                <Select
                                    value={createTaskForm.project_id || ''}
                                    onChange={(e) => handleProjectChange(Number(e.target.value))}
                                    label="Project"
                                >
                                    <MenuItem value="">Select Project</MenuItem>
                                    {projects.map((project) => (
                                        <MenuItem key={project.id} value={project.id}>
                                            {project.project_name}
                                            {project.client && (
                                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                    ({project.client.contact.first_name} {project.client.contact.last_name})
                                                </Typography>
                                            )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Build Component Selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required disabled={!createTaskForm.project_id}>
                                <InputLabel>Build Component</InputLabel>
                                <Select
                                    value={createTaskForm.build_component_id || ''}
                                    onChange={(e) => setCreateTaskForm(prev => ({ ...prev, build_component_id: Number(e.target.value) }))}
                                    label="Build Component"
                                >
                                    <MenuItem value="">Select Component</MenuItem>
                                    {buildComponents.map((component) => (
                                        <MenuItem key={component.id} value={component.id}>
                                            {component.build_deliverable.deliverable.name} - {component.coverage_scene.name} ({component.editing_style.name})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Task Template Selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Task Template</InputLabel>
                                <Select
                                    value={createTaskForm.task_template_id || ''}
                                    onChange={(e) => setCreateTaskForm(prev => ({ ...prev, task_template_id: Number(e.target.value) }))}
                                    label="Task Template"
                                >
                                    <MenuItem value="">Select Template</MenuItem>
                                    {taskTemplates.map((template) => (
                                        <MenuItem key={template.id} value={template.id}>
                                            {template.name}
                                            {template.phase && (
                                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                    ({template.phase})
                                                </Typography>
                                            )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Priority */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={createTaskForm.priority || 'Medium'}
                                    onChange={(e) => setCreateTaskForm(prev => ({ ...prev, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical' }))}
                                    label="Priority"
                                >
                                    <MenuItem value="Low">Low</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="High">High</MenuItem>
                                    <MenuItem value="Critical">Critical</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Planned Duration */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Planned Duration (hours)"
                                type="number"
                                value={createTaskForm.planned_duration_hours || ''}
                                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, planned_duration_hours: Number(e.target.value) }))}
                                inputProps={{ min: 0.5, step: 0.5 }}
                            />
                        </Grid>

                        {/* Due Date */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Due Date"
                                type="date"
                                value={createTaskForm.due_date || ''}
                                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Custom Title (optional override) */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Custom Title (optional)"
                                value={createTaskForm.title || ''}
                                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Leave empty to use template name"
                            />
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={createTaskForm.description || ''}
                                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </Grid>

                        {/* Client Visible */}
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Switch
                                        checked={createTaskForm.is_client_visible || false}
                                        onChange={(e) => setCreateTaskForm(prev => ({ ...prev, is_client_visible: e.target.checked }))}
                                    />
                                    <Typography variant="body2">
                                        Make this task visible to the client
                                    </Typography>
                                </Stack>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateTask}
                        disabled={createTaskLoading || !createTaskForm.project_id || !createTaskForm.build_component_id || !createTaskForm.task_template_id}
                    >
                        {createTaskLoading ? <CircularProgress size={20} /> : 'Create Task'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Operation Dialog */}
            <Dialog
                open={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Bulk Task Operations</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selected {selectedTasks.size} task(s)
                    </Typography>

                    {/* Operation Type */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Operation</InputLabel>
                        <Select
                            value={bulkOperation}
                            onChange={(e) => setBulkOperation(e.target.value as 'status' | 'assignee' | 'delete')}
                            label="Operation"
                        >
                            <MenuItem value="status">Change Status</MenuItem>
                            <MenuItem value="assignee">Change Assignee</MenuItem>
                            <MenuItem value="delete">Delete Tasks</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Status Field (if applicable) */}
                    {bulkOperation === 'status' && (
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={bulkStatusValue}
                                onChange={(e) => setBulkStatusValue(e.target.value as 'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived')}
                                label="Status"
                            >
                                {Object.keys(STATUS_CONFIG).map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Assignee Field (if applicable) */}
                    {bulkOperation === 'assignee' && (
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Assignee</InputLabel>
                            <Select
                                value=""
                                onChange={() => { }}
                                label="Assignee"
                            >
                                <MenuItem value="">Unassign</MenuItem>
                                {/* Map through contributors for assignee options */}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleBulkOperation}
                        disabled={bulkProcessing}
                    >
                        {bulkProcessing ? <CircularProgress size={20} /> : 'Apply Operation'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Operations */}
            {selectedTasks.size > 0 && (
                <Box sx={{
                    mb: 3,
                    p: 2,
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    backdropFilter: 'blur(8px)',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1">
                            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setBulkOperation('status');
                                    setBulkDialogOpen(true);
                                }}
                            >
                                Change Status
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={() => {
                                    setBulkOperation('delete');
                                    setBulkDialogOpen(true);
                                }}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => setSelectedTasks(new Set())}
                            >
                                Clear Selection
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Select All */}
            <Box sx={{ mb: 2 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={boardData ? selectedTasks.size > 0 && selectedTasks.size === Object.values(boardData.board).flat().length : false}
                            indeterminate={boardData ? selectedTasks.size > 0 && selectedTasks.size < Object.values(boardData.board).flat().length : false}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                    }
                    label="Select All Tasks"
                />
            </Box>
        </Box>
    );
}

// Task Column Component
interface TaskColumnProps {
    status: keyof BoardData['board'];
    title: string;
    color: 'default' | 'info' | 'warning' | 'success';
    backgroundColor: string;
    tasks: Task[];
    onTaskUpdate: () => void;
    selectedTasks: Set<number>;
    onTaskSelect: (taskId: number, selected: boolean) => void;
}

function TaskColumn({ status, title, color, backgroundColor, tasks, onTaskUpdate, selectedTasks, onTaskSelect }: TaskColumnProps) {
    const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

    return (
        <Box sx={{ minWidth: 320, flex: 1 }}>
            <Card
                sx={{
                    background: statusConfig.backgroundColor,
                    border: `1px solid ${statusConfig.borderColor}`,
                    borderRadius: 2,
                    minHeight: 580,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        borderColor: statusConfig.headerColor,
                        transform: 'translateY(-2px)',
                    },
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                        pb: 2,
                        borderBottom: `1px solid ${statusConfig.borderColor}`,
                    }}>
                        <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                                color: statusConfig.headerColor,
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                letterSpacing: '0.025em',
                            }}
                        >
                            {title}
                        </Typography>
                        <Chip
                            label={tasks.length}
                            size="small"
                            sx={{
                                backgroundColor: statusConfig.headerColor,
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                minWidth: 32,
                                height: 28,
                                '& .MuiChip-label': {
                                    px: 1,
                                }
                            }}
                        />
                    </Box>

                    <SortableContext
                        items={tasks.map(task => task.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onUpdate={onTaskUpdate}
                                    isSelected={selectedTasks.has(task.id)}
                                    onSelect={onTaskSelect}
                                />
                            ))}
                        </Box>
                    </SortableContext>
                </CardContent>
            </Card>
        </Box>
    );
}

// Task Card Component
interface TaskCardProps {
    task: Task;
    isDragging?: boolean;
    onUpdate?: () => void;
    isSelected?: boolean;
    onSelect?: (taskId: number, selected: boolean) => void;
}

function TaskCard({ task, isDragging = false, onUpdate, isSelected = false, onSelect }: TaskCardProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: task.id.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || isSortableDragging ? 0.5 : 1,
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            sx={{
                cursor: 'grab',
                mb: 2,
                borderRadius: 2,
                background: isOverdue
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                border: isOverdue
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isOverdue
                    ? '0 4px 16px rgba(239, 68, 68, 0.2)'
                    : '0 2px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isOverdue
                        ? '0 8px 24px rgba(239, 68, 68, 0.3)'
                        : '0 4px 20px rgba(0,0,0,0.25)',
                    borderColor: isOverdue
                        ? 'rgba(239, 68, 68, 0.5)'
                        : 'rgba(255, 255, 255, 0.2)',
                },
                '&:active': {
                    cursor: 'grabbing',
                },
            }}
        >
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                onSelect?.(task.id, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                                mr: 1.5,
                                p: 0.5,
                                '& .MuiSvgIcon-root': { fontSize: 18 }
                            }}
                        />
                        <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            sx={{
                                flex: 1,
                                fontSize: '0.95rem',
                                color: '#1a1a1a',
                                lineHeight: 1.3,
                            }}
                        >
                            {task.task_template.name}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            setAnchorEl(e.currentTarget);
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 2,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: '#666',
                    }}
                >
                    {task.project.project_name || `${task.project.client.contact.first_name} ${task.project.client.contact.last_name}`}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {task.task_template.phase && (
                        <Chip
                            label={task.task_template.phase}
                            size="small"
                            variant="outlined"
                            sx={{
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '0.75rem',
                            }}
                        />
                    )}
                    {isOverdue && (
                        <Chip
                            label="Overdue"
                            size="small"
                            color="error"
                            icon={<FlagIcon />}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {task._count.task_comments > 0 && (
                            <Tooltip title={`${task._count.task_comments} comments`}>
                                <Badge badgeContent={task._count.task_comments} color="primary">
                                    <CommentIcon fontSize="small" color="action" />
                                </Badge>
                            </Tooltip>
                        )}

                        <Tooltip title={`${task.planned_duration_hours}h planned`}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TimeIcon fontSize="small" color="action" />
                                <Typography variant="caption">
                                    {task.planned_duration_hours}h
                                </Typography>
                            </Box>
                        </Tooltip>
                    </Box>

                    {task.assigned_to_contributor && (
                        <Tooltip title={`${task.assigned_to_contributor.contact.first_name} ${task.assigned_to_contributor.contact.last_name}`}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {task.assigned_to_contributor.contact.first_name[0]}
                                {task.assigned_to_contributor.contact.last_name[0]}
                            </Avatar>
                        </Tooltip>
                    )}
                </Box>

                {task.due_date && (
                    <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'} sx={{ mt: 1, display: 'block' }}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                    </Typography>
                )}
            </CardContent>

            {/* Task Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        // Navigate to task detail
                        window.open(`/app-crm/tasks/${task.id}`, '_blank');
                    }}
                >
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit Task
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        // Handle delete
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete Task
                </MenuItem>
            </Menu>
        </Card>
    );
}
