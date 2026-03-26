import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Stack,
} from '@mui/material';
import {
    Person as PersonIcon,
    AssignmentTurnedIn as WorkflowIcon,
    TrendingUp as ProgressIcon,
} from '@mui/icons-material';
import { Project } from '@/features/workflow/projects/types/project.types';

const PHASE_LABELS: Record<string, string> = {
    overview: 'Project Overview',
    creative: 'Creative Development',
    preproduction: 'Pre Production',
    production: 'Production',
    postproduction: 'Post Production',
    delivery: 'Delivery',
};

function formatDate(dateString?: string) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

const sidebarCardSx = {
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    border: '1px solid rgba(52, 58, 68, 0.3)',
    background: 'rgba(16, 18, 22, 0.95)',
    backdropFilter: 'blur(10px)',
};

interface ProjectStatusSidebarProps {
    project: Project;
}

export default function ProjectStatusSidebar({ project }: ProjectStatusSidebarProps) {
    return (
        <Stack spacing={3}>
            {/* Client Information */}
            <Card sx={sidebarCardSx}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                            Client Information
                        </Typography>
                    </Box>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                Name
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                {project.client?.contact?.first_name} {project.client?.contact?.last_name}
                            </Typography>
                        </Box>
                        {project.client?.contact?.email && (
                            <Box>
                                <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                    Email
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                                    {project.client?.contact?.email}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* Project Status */}
            <Card sx={sidebarCardSx}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ProgressIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                            Project Status
                        </Typography>
                    </Box>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                Current Phase
                            </Typography>
                            <Chip
                                label={PHASE_LABELS[project.phase || ''] || 'Not Set'}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    color: '#60a5fa',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    fontWeight: 600,
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                Wedding Date
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                                {formatDate(project.wedding_date)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                Booking Date
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                                {formatDate(project.booking_date)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.5 }}>
                                Edit Start Date
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                                {formatDate(project.edit_start_date)}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* Brand Information */}
            {project.brand && (
                <Card sx={sidebarCardSx}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <WorkflowIcon sx={{ mr: 2, color: '#9ca3af', fontSize: 24 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                Brand
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#f3f4f6' }}>
                            {project.brand.display_name || project.brand.name}
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Stack>
    );
}
