'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Button,
    TextField,
    InputAdornment,
    Alert,
    CircularProgress,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Stack,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Analytics as AnalyticsIcon,
    Timeline as TimelineIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

// Types for the component data (matching our backend API)
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
}

interface ComponentAnalytics {
    total_usage: number;
    recent_usage: number;
    average_task_hours: number;
    efficiency_score: number;
}

export default function ComponentLibraryPage() {
    // State management
    const [components, setComponents] = useState<ComponentLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'COVERAGE_LINKED' | 'EDIT'>('ALL');
    const [selectedComponent, setSelectedComponent] = useState<ComponentLibrary | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
    const [componentAnalytics, setComponentAnalytics] = useState<ComponentAnalytics | null>(null);
    const [editingComponent, setEditingComponent] = useState<Partial<ComponentLibrary>>({
        name: '',
        description: '',
        type: 'COVERAGE_LINKED',
        complexity_score: 1,
        estimated_duration: 1,
        base_task_hours: '1',
    });

    // Fetch components from backend API
    const fetchComponents = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3002/components');
            if (!response.ok) {
                throw new Error(`Failed to fetch components: ${response.status}`);
            }
            const data = await response.json();
            setComponents(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load components');
            console.error('Error fetching components:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch component analytics
    const fetchComponentAnalytics = async (componentId: number) => {
        try {
            const response = await fetch(`http://localhost:3002/analytics/components/${componentId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.status}`);
            }
            const data = await response.json();
            setComponentAnalytics(data.metrics);
        } catch (err) {
            console.error('Error fetching component analytics:', err);
            setComponentAnalytics(null);
        }
    };

    // Load components on mount
    useEffect(() => {
        fetchComponents();
    }, []);

    // Filter components based on search and filters
    const filteredComponents = components.filter(component => {
        const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            component.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || component.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // Handle menu actions
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, component: ComponentLibrary) => {
        setAnchorEl(event.currentTarget);
        setSelectedComponent(component);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedComponent(null);
    };

    const handleEditComponent = () => {
        if (selectedComponent) {
            setEditingComponent(selectedComponent);
            setEditDialogOpen(true);
        }
        handleMenuClose();
    };

    const handleViewAnalytics = async () => {
        if (selectedComponent) {
            await fetchComponentAnalytics(selectedComponent.id);
            setAnalyticsDialogOpen(true);
        }
        handleMenuClose();
    };

    const handleAddComponent = () => {
        setEditingComponent({
            name: '',
            description: '',
            type: 'COVERAGE_LINKED',
            complexity_score: 1,
            estimated_duration: 1,
            base_task_hours: '1',
        });
        setAddDialogOpen(true);
    };

    const handleSaveComponent = async () => {
        try {
            const method = editingComponent.id ? 'PUT' : 'POST';
            const url = editingComponent.id
                ? `http://localhost:3002/components/${editingComponent.id}`
                : 'http://localhost:3002/components';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editingComponent.name,
                    description: editingComponent.description,
                    type: editingComponent.type,
                    complexity_score: editingComponent.complexity_score,
                    estimated_duration: editingComponent.estimated_duration,
                    base_task_hours: editingComponent.base_task_hours,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save component: ${response.status}`);
            }

            // Refresh the component list
            await fetchComponents();
            setEditDialogOpen(false);
            setAddDialogOpen(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save component');
        }
    };

    const handleDeleteComponent = async (componentId: number) => {
        if (!confirm('Are you sure you want to delete this component?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3002/components/${componentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Failed to delete component: ${response.status}`);
            }

            await fetchComponents();
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete component');
        }
    };

    // Get component type color
    const getTypeColor = (type: string): 'primary' | 'secondary' => {
        return type === 'COVERAGE_LINKED' ? 'primary' : 'secondary';
    };

    // Format duration
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Component Library
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your video production components, track usage analytics, and optimize workflows.
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Controls */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search components..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Component Type</InputLabel>
                                <Select
                                    value={typeFilter}
                                    label="Component Type"
                                    onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'COVERAGE_LINKED' | 'EDIT')}
                                >
                                    <MenuItem value="ALL">All Types</MenuItem>
                                    <MenuItem value="COVERAGE_LINKED">Coverage Linked</MenuItem>
                                    <MenuItem value="EDIT">Edit Components</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={fetchComponents}
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddComponent}
                                >
                                    Add Component
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Components Table */}
            <Card>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Component</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell align="right">Complexity</TableCell>
                                <TableCell align="right">Duration</TableCell>
                                <TableCell align="right">Task Hours</TableCell>
                                <TableCell align="right">Usage</TableCell>
                                <TableCell align="right">Performance</TableCell>
                                <TableCell align="right">Last Used</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredComponents.map((component) => (
                                <TableRow key={component.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight="bold"
                                                component="a"
                                                href={`/app-crm/components/${component.id}`}
                                                sx={{
                                                    textDecoration: 'none',
                                                    color: 'primary.main',
                                                    '&:hover': { textDecoration: 'underline' }
                                                }}
                                            >
                                                {component.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {component.description}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={component.type === 'COVERAGE_LINKED' ? 'Coverage' : 'Edit'}
                                            color={getTypeColor(component.type)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={component.complexity_score}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatDuration(component.estimated_duration)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {component.base_task_hours}h
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2">
                                            {component.usage_count}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={component.performance_score}
                                            color={Number(component.performance_score) >= 4 ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" color="text.secondary">
                                            {component.last_used_at ? formatDate(component.last_used_at) : 'Never'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            onClick={(e) => handleMenuOpen(e, component)}
                                            size="small"
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredComponents.length === 0 && !loading && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            {searchTerm || typeFilter !== 'ALL'
                                ? 'No components match your filters'
                                : 'No components found'}
                        </Typography>
                    </Box>
                )}
            </Card>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEditComponent}>
                    <EditIcon sx={{ mr: 1 }} />
                    Edit Component
                </MenuItem>
                <MenuItem onClick={handleViewAnalytics}>
                    <AnalyticsIcon sx={{ mr: 1 }} />
                    View Analytics
                </MenuItem>
                <MenuItem>
                    <TimelineIcon sx={{ mr: 1 }} />
                    Add to Timeline
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedComponent) {
                            handleDeleteComponent(selectedComponent.id);
                        }
                        handleMenuClose();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon sx={{ mr: 1 }} />
                    Delete Component
                </MenuItem>
            </Menu>

            {/* Analytics Dialog */}
            <Dialog
                open={analyticsDialogOpen}
                onClose={() => setAnalyticsDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Component Analytics: {selectedComponent?.name}
                </DialogTitle>
                <DialogContent>
                    {componentAnalytics ? (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">{componentAnalytics.total_usage}</Typography>
                                        <Typography color="text.secondary">Total Usage</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">{componentAnalytics.recent_usage}</Typography>
                                        <Typography color="text.secondary">Recent Usage</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">{componentAnalytics.average_task_hours}h</Typography>
                                        <Typography color="text.secondary">Avg Task Hours</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">{componentAnalytics.efficiency_score}</Typography>
                                        <Typography color="text.secondary">Efficiency Score</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAnalyticsDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Edit Component: {selectedComponent?.name}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Component Name"
                                value={editingComponent.name}
                                onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={editingComponent.description}
                                onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Component Type</InputLabel>
                                <Select
                                    value={editingComponent.type}
                                    label="Component Type"
                                    onChange={(e) => setEditingComponent({ ...editingComponent, type: e.target.value as 'COVERAGE_LINKED' | 'EDIT' })}
                                >
                                    <MenuItem value="COVERAGE_LINKED">Coverage Linked</MenuItem>
                                    <MenuItem value="EDIT">Edit Component</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Complexity Score"
                                type="number"
                                inputProps={{ min: 1, max: 10 }}
                                value={editingComponent.complexity_score}
                                onChange={(e) => setEditingComponent({ ...editingComponent, complexity_score: Number(e.target.value) })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Estimated Duration (minutes)"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={editingComponent.estimated_duration}
                                onChange={(e) => setEditingComponent({ ...editingComponent, estimated_duration: Number(e.target.value) })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Base Task Hours"
                                type="number"
                                inputProps={{ min: 0.5, step: 0.5 }}
                                value={editingComponent.base_task_hours}
                                onChange={(e) => setEditingComponent({ ...editingComponent, base_task_hours: e.target.value })}
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveComponent}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Add Component Dialog */}
            <Dialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Add New Component
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Component Name"
                                value={editingComponent.name}
                                onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={editingComponent.description}
                                onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Component Type</InputLabel>
                                <Select
                                    value={editingComponent.type}
                                    label="Component Type"
                                    onChange={(e) => setEditingComponent({ ...editingComponent, type: e.target.value as 'COVERAGE_LINKED' | 'EDIT' })}
                                >
                                    <MenuItem value="COVERAGE_LINKED">Coverage Linked</MenuItem>
                                    <MenuItem value="EDIT">Edit Component</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Complexity Score"
                                type="number"
                                inputProps={{ min: 1, max: 10 }}
                                value={editingComponent.complexity_score}
                                onChange={(e) => setEditingComponent({ ...editingComponent, complexity_score: Number(e.target.value) })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Estimated Duration (minutes)"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={editingComponent.estimated_duration}
                                onChange={(e) => setEditingComponent({ ...editingComponent, estimated_duration: Number(e.target.value) })}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Base Task Hours"
                                type="number"
                                inputProps={{ min: 0.5, step: 0.5 }}
                                value={editingComponent.base_task_hours}
                                onChange={(e) => setEditingComponent({ ...editingComponent, base_task_hours: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Alert severity="info">
                                <Typography variant="body2">
                                    <strong>Workflow Note:</strong> Task recipes and workflow management for this component will be available on the individual component detail page (coming in Phase 2).
                                </Typography>
                            </Alert>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveComponent}>Add Component</Button>
                </DialogActions>
            </Dialog>

            {/* Add Component Dialog */}
            <Dialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Add New Component
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Component Name"
                                fullWidth
                                value={editingComponent.name}
                                onChange={(e) => setEditingComponent({ ...editingComponent, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={4}
                                value={editingComponent.description}
                                onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Component Type</InputLabel>
                                <Select
                                    value={editingComponent.type}
                                    label="Component Type"
                                    onChange={(e) => setEditingComponent({ ...editingComponent, type: e.target.value as 'COVERAGE_LINKED' | 'EDIT' })}
                                >
                                    <MenuItem value="COVERAGE_LINKED">Coverage Linked</MenuItem>
                                    <MenuItem value="EDIT">Edit Component</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Complexity Score"
                                type="number"
                                fullWidth
                                value={editingComponent.complexity_score}
                                onChange={(e) => setEditingComponent({ ...editingComponent, complexity_score: Number(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Estimated Duration (min)"
                                type="number"
                                fullWidth
                                value={editingComponent.estimated_duration}
                                onChange={(e) => setEditingComponent({ ...editingComponent, estimated_duration: Number(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Base Task Hours"
                                type="number"
                                fullWidth
                                value={editingComponent.base_task_hours}
                                onChange={(e) => setEditingComponent({ ...editingComponent, base_task_hours: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            // Add component logic here
                            setAddDialogOpen(false);
                        }}
                    >
                        Add Component
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
