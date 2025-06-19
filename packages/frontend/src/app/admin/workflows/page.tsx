'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Grid,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Breadcrumbs,
    Link as MuiLink,
    Divider,
    Stack,
    Paper,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Analytics as AnalyticsIcon,
    Timeline as TimelineIcon,
    Task as TaskIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';

interface WorkflowTemplate {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    stage_count: number;
    project_count: number;
}

interface WorkflowOverview {
    summary: {
        total_templates: number;
        active_templates: number;
        total_stages: number;
        total_rules: number;
    };
    recentlyCreatedTemplates: WorkflowTemplate[];
    mostUsedTemplates: WorkflowTemplate[];
}

export default function AdminWorkflowsPage() {
    const router = useRouter();
    const [overview, setOverview] = useState<WorkflowOverview | null>(null);
    const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateDescription, setNewTemplateDescription] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch overview
            const overviewResponse = await fetch('http://localhost:3002/workflows/overview');
            if (!overviewResponse.ok) throw new Error('Failed to fetch overview');
            const overviewData = await overviewResponse.json();
            setOverview(overviewData);

            // Fetch all templates
            const templatesResponse = await fetch('http://localhost:3002/workflows/templates');
            if (!templatesResponse.ok) throw new Error('Failed to fetch templates');
            const templatesData = await templatesResponse.json();
            setTemplates(templatesData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        try {
            const response = await fetch('http://localhost:3002/workflows/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newTemplateName,
                    description: newTemplateDescription,
                    is_active: true,
                }),
            });

            if (!response.ok) throw new Error('Failed to create template');

            setCreateDialogOpen(false);
            setNewTemplateName('');
            setNewTemplateDescription('');
            fetchData(); // Refresh data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create template');
        }
    };

    const handleToggleActive = async (templateId: number, currentActive: boolean) => {
        try {
            const response = await fetch(`http://localhost:3002/workflows/templates/${templateId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_active: !currentActive,
                }),
            });

            if (!response.ok) throw new Error('Failed to update template');
            fetchData(); // Refresh data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update template');
        }
    };

    const handleDeleteTemplate = async (templateId: number) => {
        if (!confirm('Are you sure you want to delete this workflow template?')) return;

        try {
            const response = await fetch(`http://localhost:3002/workflows/templates/${templateId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete template');
            fetchData(); // Refresh data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete template');
        }
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
                <Breadcrumbs sx={{ mb: 2 }}>
                    <MuiLink color="inherit" href="/admin">
                        Admin
                    </MuiLink>
                    <Typography color="text.primary">Workflows</Typography>
                </Breadcrumbs>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" component="h1">
                        Workflow Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Create Template
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Overview Stats */}
            {overview && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Templates
                                </Typography>
                                <Typography variant="h4">
                                    {overview.summary.total_templates}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Active Templates
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    {overview.summary.active_templates}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Stages
                                </Typography>
                                <Typography variant="h4">
                                    {overview.summary.total_stages}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Task Rules
                                </Typography>
                                <Typography variant="h4">
                                    {overview.summary.total_rules}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Templates List */}
            <Typography variant="h5" sx={{ mb: 2 }}>
                Workflow Templates
            </Typography>

            <Grid container spacing={3}>
                {templates.map((template) => (
                    <Grid item xs={12} md={6} lg={4} key={template.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                    <Typography variant="h6" component="h3">
                                        {template.name}
                                    </Typography>
                                    <Chip
                                        label={template.is_active ? 'Active' : 'Inactive'}
                                        color={template.is_active ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>

                                {template.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {template.description}
                                    </Typography>
                                )}

                                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                    <Box display="flex" alignItems="center">
                                        <TimelineIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2">
                                            {template.stage_count} stages
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                        <TaskIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2">
                                            {template.project_count} projects
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(template.created_at).toLocaleDateString()}
                                </Typography>
                            </CardContent>

                            <Divider />

                            <CardActions>
                                <Button
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={() => router.push(`/admin/workflows/${template.id}`)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<AnalyticsIcon />}
                                    onClick={() => router.push(`/admin/workflows/${template.id}/analytics`)}
                                >
                                    Analytics
                                </Button>
                                <Tooltip title={template.is_active ? "Deactivate" : "Activate"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleToggleActive(template.id, template.is_active)}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteTemplate(template.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {templates.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No workflow templates found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Create your first workflow template to get started.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Create Template
                    </Button>
                </Paper>
            )}

            {/* Create Template Dialog */}
            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Create Workflow Template</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Template Name"
                        fullWidth
                        variant="outlined"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateTemplate}
                        variant="contained"
                        disabled={!newTemplateName.trim()}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
