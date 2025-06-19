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
import { deliverableApi } from '../_shared/api';
import { DeliverableTemplate } from '../_shared/types';

export default function DeliverableTemplatesTab() {
    const [templates, setTemplates] = useState<DeliverableTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<DeliverableTemplate | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await deliverableApi.getAllTemplates();
            setTemplates(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: DeliverableTemplate) => {
        setAnchorEl(event.currentTarget);
        setSelectedTemplate(template);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTemplate(null);
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;

        try {
            await deliverableApi.deleteTemplate(selectedTemplate.id);
            await loadTemplates(); // Reload the list
            handleMenuClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete template');
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
                    Deliverable Templates
                </Typography>
                <Button
                    component={Link}
                    href="/app-crm/settings/services/deliverables/builder"
                    variant="contained"
                    startIcon={<AddIcon />}
                >
                    Create Template
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2}>
                {templates.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                    <Typography variant="h6" component="h3" noWrap>
                                        {template.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, template)}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {template.description || 'No description'}
                                </Typography>

                                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                    <Chip
                                        label={template.type}
                                        color={template.type === 'STANDARD' ? 'primary' : 'secondary'}
                                        size="small"
                                    />
                                    <Chip
                                        label={template.includes_music ? 'With Music' : 'No Music'}
                                        variant="outlined"
                                        size="small"
                                    />
                                    {template.delivery_timeline && (
                                        <Chip
                                            label={`${template.delivery_timeline} days`}
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                </Box>

                                <Typography variant="caption" color="text.secondary">
                                    {template.template_defaults.length} component(s) • Created {formatDate(template.created_at)}
                                </Typography>
                            </CardContent>

                            <CardActions>
                                <Button
                                    component={Link}
                                    href={`/app-crm/settings/services/deliverables/${template.id}`}
                                    size="small"
                                >
                                    View
                                </Button>
                                <Button
                                    component={Link}
                                    href={`/app-crm/settings/services/deliverables/${template.id}`}
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

            {templates.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        No deliverable templates found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Create your first deliverable template to get started
                    </Typography>
                    <Button
                        component={Link}
                        href="/app-crm/settings/services/deliverables/builder"
                        variant="outlined"
                        startIcon={<AddIcon />}
                    >
                        Create Template
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
                    href={selectedTemplate ? `/app-crm/settings/services/deliverables/${selectedTemplate.id}` : '#'}
                    onClick={handleMenuClose}
                >
                    View Details
                </MenuItem>
                <MenuItem
                    component={Link}
                    href={selectedTemplate ? `/app-crm/settings/services/deliverables/${selectedTemplate.id}` : '#'}
                    onClick={handleMenuClose}
                >
                    Edit Template
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    Delete Template
                </MenuItem>
            </Menu>
        </Box>
    );
}
