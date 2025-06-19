'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Extension as ExtensionIcon,
    PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Avatar
} from '@mui/material';
import { ComponentLibrary } from '../_shared/types';

export default function VideoComponentsPage() {
    const [components, setComponents] = useState<ComponentLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedComponent, setSelectedComponent] = useState<ComponentLibrary | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState({ name: '', description: '', type: 'transition' });

    useEffect(() => {
        loadComponents();
    }, []);

    const loadComponents = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            const mockData: ComponentLibrary[] = [
                {
                    id: 1,
                    name: 'Fade In/Out',
                    description: 'Smooth fade transition between clips',
                    type: 'PRODUCTION',
                    complexity_score: 3,
                    estimated_duration: 2,
                    default_editing_style: 'fade',
                    base_task_hours: '0.5',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Cross Dissolve',
                    description: 'Blend two clips together seamlessly',
                    type: 'PRODUCTION',
                    complexity_score: 4,
                    estimated_duration: 1.5,
                    default_editing_style: 'dissolve',
                    base_task_hours: '0.75',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Title Card',
                    description: 'Elegant title overlay with custom fonts',
                    type: 'overlay',
                    duration: 3,
                    settings: { font_family: 'Playfair Display', font_size: 48 },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            setComponents(mockData);
        } catch (error) {
            console.error('Error loading video components:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, component: ComponentLibrary) => {
        setAnchorEl(event.currentTarget);
        setSelectedComponent(component);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedComponent(null);
    };

    const handleAddNew = () => {
        setDialogMode('add');
        setFormData({ name: '', description: '', type: 'transition' });
        setOpenDialog(true);
    };

    const handleEdit = () => {
        if (selectedComponent) {
            setDialogMode('edit');
            setFormData({
                name: selectedComponent.name,
                description: selectedComponent.description || '',
                type: selectedComponent.type
            });
            setOpenDialog(true);
        }
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (selectedComponent && window.confirm('Are you sure you want to delete this video component?')) {
            try {
                // TODO: Replace with actual API call
                setComponents(prev => prev.filter(c => c.id !== selectedComponent.id));
            } catch (error) {
                console.error('Error deleting video component:', error);
            }
        }
        handleMenuClose();
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setFormData({ name: '', description: '', type: 'transition' });
    };

    const handleDialogSave = async () => {
        try {
            if (dialogMode === 'add') {
                // TODO: Replace with actual API call
                const newComponent: ComponentLibrary = {
                    id: Date.now(),
                    name: formData.name,
                    description: formData.description,
                    type: formData.type as 'COVERAGE_BASED' | 'PRODUCTION',
                    complexity_score: 3,
                    estimated_duration: undefined,
                    default_editing_style: undefined,
                    base_task_hours: '1.0',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                setComponents(prev => [...prev, newComponent]);
            } else if (selectedComponent) {
                // TODO: Replace with actual API call
                setComponents(prev => prev.map(c =>
                    c.id === selectedComponent.id
                        ? {
                            ...c,
                            name: formData.name,
                            description: formData.description,
                            type: formData.type as 'COVERAGE_BASED' | 'PRODUCTION',
                            updated_at: new Date().toISOString()
                        }
                        : c
                ));
            }
            handleDialogClose();
        } catch (error) {
            console.error('Error saving video component:', error);
        }
    };

    const getComponentTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'default' => {
        switch (type) {
            case 'transition': return 'primary';
            case 'overlay': return 'secondary';
            case 'effect': return 'success';
            default: return 'default';
        }
    };

    const getComponentIcon = (type: string) => {
        switch (type) {
            case 'transition': return '→';
            case 'overlay': return '⌘';
            case 'effect': return '✨';
            default: return '📹';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton
                    component={Link}
                    href="/app-crm/settings/services"
                    sx={{ mr: 2 }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                        Video Components
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage video components and their configurations
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                >
                    Add Component
                </Button>
            </Box>

            {/* Components Grid */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <Typography>Loading video components...</Typography>
                </Box>
            ) : components.length === 0 ? (
                <Card sx={{ textAlign: 'center', py: 4 }}>
                    <CardContent>
                        <ExtensionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            No Video Components Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Create your first video component to get started
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddNew}
                        >
                            Add Your First Component
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {components.map((component) => (
                        <Grid item xs={12} sm={6} md={4} key={component.id}>
                            <Card sx={{ height: '100%', position: 'relative' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                            {getComponentIcon(component.type)}
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="h3">
                                                {component.name}
                                            </Typography>
                                            <Chip
                                                label={component.type}
                                                size="small"
                                                color={getComponentTypeColor(component.type)}
                                                sx={{ mt: 0.5 }}
                                            />
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuClick(e, component)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>

                                    {component.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {component.description}
                                        </Typography>
                                    )}

                                    {component.estimated_duration && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PlayArrowIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {component.estimated_duration}s duration
                                            </Typography>
                                        </Box>
                                    )}

                                    <Typography variant="caption" color="text.secondary">
                                        Created {new Date(component.created_at).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEdit}>
                    <EditIcon sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === 'add' ? 'Add New Video Component' : 'Edit Video Component'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Component Name"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Component Type"
                        fullWidth
                        variant="outlined"
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        SelectProps={{
                            native: true,
                        }}
                    >
                        <option value="transition">Transition</option>
                        <option value="overlay">Overlay</option>
                        <option value="effect">Effect</option>
                        <option value="filter">Filter</option>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button
                        onClick={handleDialogSave}
                        variant="contained"
                        disabled={!formData.name.trim()}
                    >
                        {dialogMode === 'add' ? 'Add' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
