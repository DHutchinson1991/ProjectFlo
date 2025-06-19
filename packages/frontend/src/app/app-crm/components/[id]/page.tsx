'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Breadcrumbs,
    Link as MuiLink,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip,
    Snackbar,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Timeline as TimelineIcon,
    Assignment as AssignmentIcon,
    Analytics as AnalyticsIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import {
    CSS,
} from '@dnd-kit/utilities';

// Component data interface
interface ComponentLibrary {
    id: number;
    name: string;
    description: string;
    type: 'COVERAGE_LINKED' | 'EDIT';
    complexity_score: number;
    estimated_duration: number;
    base_task_hours: string;
    usage_count: number;
    performance_score: string;
    created_at: string;
    updated_at: string;
    last_used_at?: string;
    component_tasks?: TaskRecipe[];
}

interface TaskRecipe {
    id: number;
    task_template_name: string;
    hours_required: number;
    order_index: number;
}

interface TaskTemplate {
    id: number;
    name: string;
    phase?: string;
    effort_hours?: number;
    pricing_type: 'Hourly' | 'Fixed';
    fixed_price?: number;
    average_duration_hours?: number;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`component-tabpanel-${index}`}
            aria-labelledby={`component-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function ComponentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const componentId = params.id as string;

    const [component, setComponent] = useState<ComponentLibrary | null>(null);
    const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState(0);
    const [taskRecipeDialogOpen, setTaskRecipeDialogOpen] = useState(false);
    const [editingTaskRecipe, setEditingTaskRecipe] = useState<TaskRecipe | null>(null);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [taskRecipeToDelete, setTaskRecipeToDelete] = useState<number | null>(null);

    // Fetch component details
    const fetchComponent = async () => {
        try {
            const response = await fetch(`http://localhost:3002/components/${componentId}`);
            if (!response.ok) {
                throw new Error(`Component not found: ${response.status}`);
            }
            const data = await response.json();
            setComponent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch component');
        }
    };

    // Fetch task templates
    const fetchTaskTemplates = async () => {
        try {
            const response = await fetch('http://localhost:3002/task-templates');
            if (response.ok) {
                const templates = await response.json();
                setTaskTemplates(templates);
            }
        } catch (err) {
            console.error('Failed to fetch task templates:', err);
        }
    };

    // Add task recipe
    const addTaskRecipe = async (taskTemplateName: string, hoursRequired: number) => {
        try {
            const response = await fetch(`http://localhost:3002/components/${componentId}/task-recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    task_template_name: taskTemplateName,
                    hours_required: hoursRequired,
                    order_index: (component?.component_tasks?.length || 0) + 1
                }])
            });

            if (response.ok) {
                await fetchComponent(); // Refresh component data
                setTaskRecipeDialogOpen(false);
                setSuccessMessage(`Task recipe "${taskTemplateName}" added successfully`);
            } else {
                throw new Error('Failed to add task recipe');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add task recipe');
        }
    };

    // Delete task recipe with confirmation
    const handleDeleteTaskRecipe = (recipeId: number) => {
        setTaskRecipeToDelete(recipeId);
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteTaskRecipe = async () => {
        if (taskRecipeToDelete) {
            await deleteTaskRecipe(taskRecipeToDelete);
            setDeleteConfirmOpen(false);
            setTaskRecipeToDelete(null);
        }
    };

    // Delete task recipe
    const deleteTaskRecipe = async (recipeId: number) => {
        try {
            const response = await fetch(`http://localhost:3002/components/${componentId}/task-recipes/${recipeId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchComponent(); // Refresh component data
                setSuccessMessage('Task recipe deleted successfully');
            } else {
                throw new Error('Failed to delete task recipe');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete task recipe');
        }
    };

    // Handle drag end event for task recipe reordering
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !component) {
            return;
        }

        const taskRecipes = [...component.component_tasks];
        const activeIndex = taskRecipes.findIndex(recipe => recipe.id.toString() === active.id);
        const overIndex = taskRecipes.findIndex(recipe => recipe.id.toString() === over.id);

        if (activeIndex !== -1 && overIndex !== -1) {
            const reorderedRecipes = arrayMove(taskRecipes, activeIndex, overIndex);

            // Update order_index for all recipes
            const updatedRecipes = reorderedRecipes.map((recipe, index) => ({
                ...recipe,
                order_index: index + 1
            }));

            // Optimistically update the UI
            setComponent({
                ...component,
                component_tasks: updatedRecipes
            });

            try {
                // Update all recipes on the backend
                const updatePromises = updatedRecipes.map(recipe =>
                    fetch(`http://localhost:3002/components/task-recipes/${recipe.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_index: recipe.order_index })
                    })
                );

                await Promise.all(updatePromises);
                setSuccessMessage('Task recipe order updated successfully');
            } catch {
                setError('Failed to update task recipe order');
                // Revert the optimistic update
                await fetchComponent();
            }
        }
    };

    // Update task recipe
    const updateTaskRecipe = async (recipeId: number, updates: Partial<TaskRecipe>) => {
        try {
            const response = await fetch(`http://localhost:3002/components/task-recipes/${recipeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                await fetchComponent(); // Refresh component data
                setEditingTaskRecipe(null);
                setSuccessMessage('Task recipe updated successfully');
            } else {
                throw new Error('Failed to update task recipe');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task recipe');
        }
    };

    // Setup drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load component data and task templates
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchComponent(), fetchTaskTemplates()]);
            setLoading(false);
        };

        if (componentId) {
            loadData();
        }
    }, [componentId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Only handle shortcuts when not typing in input fields
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'n':
                        event.preventDefault();
                        setTaskRecipeDialogOpen(true);
                        break;
                    case 's':
                        event.preventDefault();
                        if (editingTaskRecipe) {
                            // Handle save if in editing mode
                        }
                        break;
                }
            }

            if (event.key === 'Escape') {
                if (taskRecipeDialogOpen) {
                    setTaskRecipeDialogOpen(false);
                } else if (editingTaskRecipe) {
                    setEditingTaskRecipe(null);
                } else if (deleteConfirmOpen) {
                    setDeleteConfirmOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [taskRecipeDialogOpen, editingTaskRecipe, deleteConfirmOpen]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !component) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    {error || 'Component not found'}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    sx={{ mt: 2 }}
                >
                    Back to Components
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link href="/app-crm/components" passHref legacyBehavior>
                    <MuiLink underline="hover" color="inherit">
                        Components
                    </MuiLink>
                </Link>
                <Typography color="text.primary">{component.name}</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {component.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {component.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={component.type === 'COVERAGE_LINKED' ? 'Coverage Linked' : 'Edit Component'}
                            color={component.type === 'COVERAGE_LINKED' ? 'primary' : 'secondary'}
                        />
                        <Chip label={`Complexity: ${component.complexity_score}`} variant="outlined" />
                        <Chip label={`${component.estimated_duration} minutes`} variant="outlined" />
                        <Chip label={`${component.base_task_hours}h base`} variant="outlined" />
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/app-crm/components/${componentId}/edit`)}
                >
                    Edit Component
                </Button>
            </Box>

            {/* Component Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">{component.usage_count}</Typography>
                            <Typography color="text.secondary">Total Usage</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">{component.performance_score}</Typography>
                            <Typography color="text.secondary">Performance Score</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">
                                {component.last_used_at ? new Date(component.last_used_at).toLocaleDateString() : 'Never'}
                            </Typography>
                            <Typography color="text.secondary">Last Used</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">{component.component_tasks?.length || 0}</Typography>
                            <Typography color="text.secondary">Task Recipes</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                        <Tab label="Workflow & Tasks" icon={<AssignmentIcon />} />
                        <Tab label="Timeline Usage" icon={<TimelineIcon />} />
                        <Tab label="Analytics" icon={<AnalyticsIcon />} />
                    </Tabs>
                </Box>

                {/* Workflow & Tasks Tab */}
                <TabPanel value={currentTab} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Task Recipes</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setTaskRecipeDialogOpen(true)}
                        >
                            Add Task Recipe
                        </Button>
                    </Box>

                    {/* Task Recipe Summary */}
                    {component.component_tasks && component.component_tasks.length > 0 && (
                        <Card variant="outlined" sx={{ mb: 3, backgroundColor: 'background.paper' }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h6" color="primary">
                                                {component.component_tasks.length}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Tasks
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h6" color="primary">
                                                {component.component_tasks.reduce((sum, recipe) => sum + recipe.hours_required, 0)}h
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Hours
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h6" color="primary">
                                                {Math.round((component.component_tasks.reduce((sum, recipe) => sum + recipe.hours_required, 0) / component.component_tasks.length) * 10) / 10}h
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Avg. per Task
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {(!component.component_tasks || component.component_tasks.length === 0) ? (
                        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
                            <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" gutterBottom color="text.secondary">
                                No task recipes defined yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Task recipes define the specific tasks and estimated hours needed to complete this component.
                                Start by adding task templates that best represent the work required.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setTaskRecipeDialogOpen(true)}
                                size="large"
                            >
                                Add Your First Task Recipe
                            </Button>
                        </Paper>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={component.component_tasks.map(task => task.id.toString())}
                                strategy={verticalListSortingStrategy}
                            >
                                <Box sx={{ mb: 2 }}>
                                    <Alert severity="info" sx={{ backgroundColor: 'primary.50' }}>
                                        <Typography variant="body2">
                                            <strong>💡 Tips:</strong> Drag tasks using the grip handle to reorder •
                                            Click hours to edit inline • Press <strong>Ctrl+N</strong> to add new task •
                                            <strong>Esc</strong> to close dialogs
                                        </Typography>
                                    </Alert>
                                </Box>
                                <TableContainer component={Paper} elevation={2}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                                <TableCell>
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        Task Template
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        Hours Required
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        Order
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        Actions
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {component.component_tasks.map((recipe: TaskRecipe) => (
                                                <SortableTaskRecipe
                                                    key={recipe.id}
                                                    recipe={recipe}
                                                    onEdit={setEditingTaskRecipe}
                                                    onDelete={handleDeleteTaskRecipe}
                                                    onUpdate={updateTaskRecipe}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </SortableContext>
                        </DndContext>
                    )}
                </TabPanel>

                {/* Timeline Usage Tab */}
                <TabPanel value={currentTab} index={1}>
                    <Typography variant="h6" gutterBottom>Timeline Usage</Typography>
                    <Alert severity="info">
                        <Typography variant="body2">
                            <strong>Phase 2 Feature:</strong> This will show where this component is used across different
                            timelines, including deliverable assignments, timeline positions, and usage patterns.
                        </Typography>
                    </Alert>
                </TabPanel>

                {/* Analytics Tab */}
                <TabPanel value={currentTab} index={2}>
                    <Typography variant="h6" gutterBottom>Component Analytics</Typography>
                    <Alert severity="info">
                        <Typography variant="body2">
                            <strong>Enhanced Analytics:</strong> Detailed performance metrics, efficiency trends,
                            and optimization recommendations will be available here.
                        </Typography>
                    </Alert>
                </TabPanel>
            </Card>

            {/* Task Recipe Dialog */}
            <TaskRecipeDialog
                open={taskRecipeDialogOpen}
                onClose={() => setTaskRecipeDialogOpen(false)}
                onSave={addTaskRecipe}
                taskTemplates={taskTemplates}
                editingRecipe={editingTaskRecipe}
                onEditComplete={() => setEditingTaskRecipe(null)}
            />

            {/* Success Message Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage('')}
                message={successMessage}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delete Task Recipe</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this task recipe? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDeleteTaskRecipe} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Task Recipe Dialog Component
interface TaskRecipeDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (taskTemplateName: string, hoursRequired: number) => void;
    taskTemplates: TaskTemplate[];
    editingRecipe?: TaskRecipe | null;
    onEditComplete: () => void;
}

function TaskRecipeDialog({
    open,
    onClose,
    onSave,
    taskTemplates,
    editingRecipe,
    onEditComplete
}: TaskRecipeDialogProps) {
    const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
    const [hoursRequired, setHoursRequired] = React.useState<number>(0);
    const [error, setError] = React.useState<string>('');

    // Reset form when dialog opens/closes
    React.useEffect(() => {
        if (open) {
            if (editingRecipe) {
                setSelectedTemplate(editingRecipe.task_template_name);
                setHoursRequired(editingRecipe.hours_required);
            } else {
                setSelectedTemplate('');
                setHoursRequired(0);
            }
            setError('');
        }
    }, [open, editingRecipe]);

    const handleSave = () => {
        if (!selectedTemplate) {
            setError('Please select a task template');
            return;
        }
        if (hoursRequired <= 0) {
            setError('Please enter a valid number of hours');
            return;
        }

        onSave(selectedTemplate, hoursRequired);
        onClose();
        if (editingRecipe) {
            onEditComplete();
        }
    };

    const handleTemplateChange = (templateName: string) => {
        setSelectedTemplate(templateName);

        // Auto-fill hours from template if available
        const template = taskTemplates.find(t => t.name === templateName);
        if (template && template.effort_hours) {
            setHoursRequired(Number(template.effort_hours));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {editingRecipe ? 'Edit Task Recipe' : 'Add Task Recipe'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Task Template</InputLabel>
                        <Select
                            value={selectedTemplate}
                            label="Task Template"
                            onChange={(e) => handleTemplateChange(e.target.value)}
                        >
                            {taskTemplates.map((template) => (
                                <MenuItem key={template.id} value={template.name}>
                                    <Box>
                                        <Typography variant="body1">{template.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {template.phase} • {template.effort_hours}h • {template.pricing_type}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Hours Required"
                        type="number"
                        value={hoursRequired}
                        onChange={(e) => setHoursRequired(Number(e.target.value))}
                        inputProps={{ min: 0, step: 0.5 }}
                        helperText="Estimated hours needed for this component"
                        sx={{ mb: 2 }}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    {editingRecipe ? 'Update' : 'Add'} Recipe
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Sortable Task Recipe Component
interface SortableTaskRecipeProps {
    recipe: TaskRecipe;
    onEdit: (recipe: TaskRecipe) => void;
    onDelete: (recipeId: number) => void;
    onUpdate: (recipeId: number, updates: Partial<TaskRecipe>) => void;
}

function SortableTaskRecipe({ recipe, onEdit, onDelete, onUpdate }: SortableTaskRecipeProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(recipe.hours_required);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: recipe.id.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSaveEdit = async () => {
        if (editValue !== recipe.hours_required && editValue > 0) {
            await onUpdate(recipe.id, { hours_required: editValue });
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditValue(recipe.hours_required);
        setIsEditing(false);
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes}>
            <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DragIcon
                        {...listeners}
                        sx={{
                            cursor: 'grab',
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main' }
                        }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                        {recipe.task_template_name}
                    </Typography>
                </Box>
            </TableCell>
            <TableCell align="right">
                {isEditing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                        <TextField
                            size="small"
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            inputProps={{ min: 0, step: 0.5 }}
                            sx={{ width: 80 }}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        />
                        <IconButton size="small" onClick={handleSaveEdit} color="primary">
                            <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancelEdit}>
                            <CancelIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ) : (
                    <Chip
                        label={`${recipe.hours_required}h`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => setIsEditing(true)}
                        sx={{ cursor: 'pointer' }}
                    />
                )}
            </TableCell>
            <TableCell align="right">
                <Chip
                    label={recipe.order_index}
                    size="small"
                    variant="outlined"
                    color="secondary"
                />
            </TableCell>
            <TableCell align="right">
                <Tooltip title="Edit task recipe">
                    <IconButton size="small" onClick={() => onEdit(recipe)}>
                        <EditIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete task recipe">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(recipe.id)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
}
