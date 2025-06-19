'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { componentApi } from '../_shared/api';
import { ComponentLibrary } from '../_shared/types';

export default function ComponentsTab() {
    const [components, setComponents] = useState<ComponentLibrary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedComponent, setSelectedComponent] = useState<ComponentLibrary | null>(null);

    useEffect(() => {
        loadComponents();
    }, []);

    const loadComponents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await componentApi.getAllComponents();
            setComponents(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load components');
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, component: ComponentLibrary) => {
        setAnchorEl(event.currentTarget);
        setSelectedComponent(component);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedComponent(null);
    };

    const handleDelete = async () => {
        if (!selectedComponent) return;

        try {
            await componentApi.deleteComponent(selectedComponent.id);
            await loadComponents(); // Reload the list
            handleMenuClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete component');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                    Video Components
                </Typography>
                <Button
                    component={Link}
                    href="/app-crm/components"
                    variant="contained"
                    startIcon={<AddIcon />}
                >
                    Manage Components
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2}>
                {components.map((component) => (
                    <Grid item xs={12} sm={6} md={4} key={component.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                    <Typography variant="h6" component="h3" noWrap>
                                        {component.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, component)}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {component.description || 'No description'}
                                </Typography>

                                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                    <Chip
                                        label={component.type}
                                        color={component.type === 'COVERAGE_BASED' ? 'primary' : 'secondary'}
                                        size="small"
                                    />
                                    <Chip
                                        label={`Complexity: ${component.complexity_score}/10`}
                                        variant="outlined"
                                        size="small"
                                    />
                                    {component.estimated_duration && (
                                        <Chip
                                            label={`~${component.estimated_duration} min`}
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                </Box>

                                <Typography variant="caption" color="text.secondary">
                                    {component.base_task_hours}h base • Created {formatDate(component.created_at)}
                                </Typography>
                            </CardContent>

                            <CardActions>
                                <Button
                                    component={Link}
                                    href={`/app-crm/components/${component.id}`}
                                    size="small"
                                >
                                    View
                                </Button>
                                <Button
                                    component={Link}
                                    href={`/app-crm/components/${component.id}/edit`}
                                    size="small"
                                    startIcon={<EditIcon />}
                                >
                                    Edit
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {components.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        No video components found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Components are the building blocks of deliverable templates
                    </Typography>
                    <Button
                        component={Link}
                        href="/app-crm/components"
                        variant="outlined"
                        startIcon={<AddIcon />}
                    >
                        Manage Components
                    </Button>
                </Box>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem
                    component={Link}
                    href={selectedComponent ? `/app-crm/components/${selectedComponent.id}` : '#'}
                    onClick={handleMenuClose}
                >
                    View Details
                </MenuItem>
                <MenuItem
                    component={Link}
                    href={selectedComponent ? `/app-crm/components/${selectedComponent.id}/edit` : '#'}
                    onClick={handleMenuClose}
                >
                    Edit Component
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    Delete Component
                </MenuItem>
            </Menu>
        </Box>
    );
}
