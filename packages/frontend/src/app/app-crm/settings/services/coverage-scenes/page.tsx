'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon
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
    TextField
} from '@mui/material';

interface CoverageScene {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export default function CoverageScenesPage() {
    const [scenes, setScenes] = useState<CoverageScene[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScene, setSelectedScene] = useState<CoverageScene | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        loadScenes();
    }, []);

    const loadScenes = async () => {
        try {
            // TODO: Replace with actual API call
            setScenes([
                {
                    id: 1,
                    name: 'Ceremony',
                    description: 'Wedding ceremony coverage',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Reception',
                    description: 'Wedding reception coverage',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Bridal Prep',
                    description: 'Bride getting ready coverage',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);
        } catch (error) {
            console.error('Error loading coverage scenes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, scene: CoverageScene) => {
        setAnchorEl(event.currentTarget);
        setSelectedScene(scene);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedScene(null);
    };

    const handleAdd = () => {
        setDialogMode('add');
        setFormData({ name: '', description: '' });
        setOpenDialog(true);
        handleMenuClose();
    };

    const handleEdit = () => {
        if (selectedScene) {
            setDialogMode('edit');
            setFormData({
                name: selectedScene.name,
                description: selectedScene.description || ''
            });
            setOpenDialog(true);
        }
        handleMenuClose();
    };

    const handleDelete = () => {
        if (selectedScene) {
            // TODO: Implement delete functionality
            console.log('Delete scene:', selectedScene.id);
        }
        handleMenuClose();
    };

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Save scene:', formData);
        setOpenDialog(false);
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setFormData({ name: '', description: '' });
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </Box>
        );
    }

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
                    <Typography variant="h4" component="h1">
                        Coverage Scenes
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage coverage scenes for video deliverables
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    Add Scene
                </Button>
            </Box>

            {/* Scenes Grid */}
            <Grid container spacing={3}>
                {scenes.map((scene) => (
                    <Grid item xs={12} sm={6} md={4} key={scene.id}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                        {scene.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, scene)}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                                {scene.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {scene.description}
                                    </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    Created {new Date(scene.created_at).toLocaleDateString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {scenes.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        No coverage scenes yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Create your first coverage scene to get started
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                        Add Coverage Scene
                    </Button>
                </Box>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEdit}>
                    <EditIcon sx={{ mr: 1 }} fontSize="small" />
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                    Delete
                </MenuItem>
            </Menu>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === 'add' ? 'Add Coverage Scene' : 'Edit Coverage Scene'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Scene Name"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {dialogMode === 'add' ? 'Add' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
