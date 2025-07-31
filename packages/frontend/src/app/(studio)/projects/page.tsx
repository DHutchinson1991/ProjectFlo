"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useProjects } from '../providers/ProjectProvider';

export default function ProjectManagementPage() {
    const router = useRouter();
    const { projects, createProject, deleteProject } = useProjects();

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Form states
    const [newProjectName, setNewProjectName] = useState('');
    const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);

    // Notification states
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({ message, severity });
    };

    // Navigation handler
    const handleProjectClick = (projectId: number) => {
        router.push(`/projects/${projectId}`);
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            showNotification('Project name is required', 'error');
            return;
        }

        const result = await createProject(newProjectName.trim());
        if (result) {
            showNotification('Project created successfully', 'success');
            setNewProjectName('');
            setCreateDialogOpen(false);
        } else {
            showNotification('Failed to create project', 'error');
        }
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        const result = await deleteProject(projectToDelete.id);
        if (result) {
            showNotification('Project deleted successfully', 'success');
            setProjectToDelete(null);
            setDeleteDialogOpen(false);
        } else {
            showNotification('Failed to delete project', 'error');
        }
    };

    const openDeleteDialog = (project: { id: number; project_name: string }) => {
        setProjectToDelete({ id: project.id, name: project.project_name || `Project ${project.id}` });
        setDeleteDialogOpen(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Project Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ px: 3 }}
                >
                    Create Project
                </Button>
            </Box>

            {/* Projects Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                        All Projects
                    </Typography>

                    {projects.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                No projects found
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setCreateDialogOpen(true)}
                            >
                                Create Your First Project
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Project Name</TableCell>
                                        <TableCell>Wedding Date</TableCell>
                                        <TableCell>Phase</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {projects.map((project) => (
                                        <TableRow
                                            key={project.id}
                                            hover
                                            onClick={() => handleProjectClick(project.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {project.project_name || `Project ${project.id}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {project.wedding_date
                                                        ? new Date(project.wedding_date).toLocaleDateString()
                                                        : 'Not set'
                                                    }
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {project.phase || 'Planning'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteDialog(project);
                                                    }}
                                                    color="error"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Create Project Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Project Name"
                        fullWidth
                        variant="outlined"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateProject();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateProject} variant="contained" disabled={!newProjectName.trim()}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Project Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteProject} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            {notification && (
                <Snackbar
                    open={true}
                    autoHideDuration={6000}
                    onClose={() => setNotification(null)}
                >
                    <Alert
                        onClose={() => setNotification(null)}
                        severity={notification.severity}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
}
