"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Snackbar,
    Alert,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Search as SearchIcon,
    Folder as ProjectIcon,
    Person as PersonIcon,
    Event as EventIcon,
    Category as PhaseIcon,
    Assignment as StatusIcon,
    Inventory as PackageIcon,
    AccessTime,
} from '@mui/icons-material';
import { useProjects, useDeleteProject } from '@/features/workflow/projects';
import type { ProjectListItem } from '@/features/workflow/projects';
import { StudioTable, type StudioColumn } from '@/shared/ui';
import { sectionColors } from '@/shared/theme/tokens';
import { PHASE_CONFIG_MAP } from '../constants/project-phases';

const STATUS_COLORS: Record<string, string> = {
    Active: '#10b981',
    On_Hold: '#f59e0b',
    Completed: '#3b82f6',
    Cancelled: '#ef4444',
};

export default function ProjectListScreen() {
    const router = useRouter();
    const { data: projects = [], isLoading } = useProjects();
    const deleteProject = useDeleteProject();

    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(null);
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return projects;
        const q = searchQuery.toLowerCase();
        return projects.filter((p) => {
            const name = (p.project_name ?? '').toLowerCase();
            const contact = `${p.contact?.first_name ?? ''} ${p.contact?.last_name ?? ''}`.toLowerCase();
            const pkg = (p.source_package?.name ?? '').toLowerCase();
            return name.includes(q) || contact.includes(q) || pkg.includes(q);
        });
    }, [projects, searchQuery]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteProject.mutateAsync(deleteTarget.id);
            setNotification({ message: 'Project deleted', severity: 'success' });
        } catch {
            setNotification({ message: 'Failed to delete project', severity: 'error' });
        } finally {
            setDeleteTarget(null);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress size={48} sx={{ color: sectionColors.projects }} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ProjectIcon sx={{ fontSize: 28, color: sectionColors.projects }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Projects
                    </Typography>
                    <Chip
                        label={projects.length}
                        size="small"
                        sx={{
                            bgcolor: sectionColors.projects + '20',
                            color: sectionColors.projects,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                        }}
                    />
                </Box>
            </Box>

            {/* Search */}
            <Box sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />
            </Box>

            {/* Table */}
            {filteredProjects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                    <ProjectIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                        {projects.length === 0
                            ? 'No projects yet — convert an inquiry to get started'
                            : 'No projects match your search'}
                    </Typography>
                </Box>
            ) : (
                <StudioTable
                    sectionColor={sectionColors.projects}
                    columns={[
                        {
                            key: 'contact',
                            label: 'Client',
                            flex: 2,
                            headerIcon: <PersonIcon />,
                            render: (project) => {
                                const name = `${project.contact?.first_name ?? ''} ${project.contact?.last_name ?? ''}`.trim();
                                return (
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {(project.project_name ?? name) || `Project ${project.id}`}
                                        </Typography>
                                        {name && project.project_name && (
                                            <Typography variant="caption" color="text.secondary">
                                                {name}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            },
                        },
                        {
                            key: 'event_date',
                            label: 'Event Date',
                            width: 130,
                            headerIcon: <EventIcon />,
                            render: (project) => (
                                <Typography variant="body2" color={project.wedding_date ? 'text.primary' : 'text.secondary'}>
                                    {project.wedding_date
                                        ? new Date(project.wedding_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : '-'}
                                </Typography>
                            ),
                        },
                        {
                            key: 'phase',
                            label: 'Phase',
                            width: 160,
                            headerIcon: <PhaseIcon />,
                            render: (project) => {
                                const config = PHASE_CONFIG_MAP.get(project.phase);
                                return (
                                    <Chip
                                        label={config?.name ?? project.phase}
                                        size="small"
                                        sx={{
                                            bgcolor: (config?.color ?? '#64748b') + '20',
                                            color: config?.color ?? '#64748b',
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                        }}
                                    />
                                );
                            },
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            width: 110,
                            headerIcon: <StatusIcon />,
                            render: (project) => (
                                <Chip
                                    label={project.status.replace('_', ' ')}
                                    size="small"
                                    sx={{
                                        bgcolor: (STATUS_COLORS[project.status] ?? '#64748b') + '20',
                                        color: STATUS_COLORS[project.status] ?? '#64748b',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                    }}
                                />
                            ),
                        },
                        {
                            key: 'package',
                            label: 'Package',
                            flex: 1,
                            headerIcon: <PackageIcon />,
                            render: (project) => (
                                <Typography variant="body2" color={project.source_package ? 'text.primary' : 'text.secondary'}>
                                    {project.source_package?.name ?? '-'}
                                </Typography>
                            ),
                        },
                        {
                            key: 'created_at',
                            label: 'Created',
                            width: 110,
                            headerIcon: <AccessTime />,
                            render: (project) => (
                                <Typography variant="body2">
                                    {new Date(project.created_at).toLocaleDateString()}
                                </Typography>
                            ),
                        },
                        {
                            key: 'actions',
                            label: '',
                            width: 50,
                            align: 'right' as const,
                            render: (project) => (
                                <Box onClick={(e) => e.stopPropagation()}>
                                    <Tooltip title="Delete project">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => setDeleteTarget(project)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ),
                        },
                    ] as StudioColumn<ProjectListItem>[]}
                    rows={filteredProjects}
                    getRowKey={(p) => p.id}
                    onRowClick={(p) => router.push(`/projects/${p.id}`)}
                    emptyMessage="No projects match your search"
                />
            )}

            {/* Delete Dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete &quot;{deleteTarget?.project_name ?? `Project ${deleteTarget?.id}`}&quot;? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteProject.isPending}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification */}
            {notification && (
                <Snackbar open autoHideDuration={4000} onClose={() => setNotification(null)}>
                    <Alert onClose={() => setNotification(null)} severity={notification.severity} sx={{ width: '100%' }}>
                        {notification.message}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
}
