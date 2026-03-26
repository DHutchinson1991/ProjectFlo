"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Chip,
    LinearProgress,
    Menu,
    MenuItem,
    IconButton,
    linearProgressClasses,
} from '@mui/material';
import {
    UnfoldMore as SwitchIcon,
    CalendarMonth as CalendarIcon,
    FolderOpen as FolderIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useProjects } from '@/features/workflow/projects';

// Phase config: label, color, progress percentage
const PHASE_CONFIG: Record<string, { label: string; color: string; progress: number }> = {
    'pre-production': { label: 'Pre-Production', color: '#90caf9', progress: 15 },
    'planning': { label: 'Planning', color: '#80deea', progress: 25 },
    'production': { label: 'Production', color: '#a5d6a7', progress: 50 },
    'filming': { label: 'Filming', color: '#fff176', progress: 60 },
    'post-production': { label: 'Post-Production', color: '#ffab91', progress: 75 },
    'editing': { label: 'Editing', color: '#ce93d8', progress: 85 },
    'delivery': { label: 'Delivery', color: '#81c784', progress: 95 },
    'completed': { label: 'Completed', color: '#66bb6a', progress: 100 },
};

function getPhaseInfo(phase?: string) {
    if (!phase) return { label: 'Not Set', color: '#78909c', progress: 0 };
    const key = phase.toLowerCase().replace(/\s+/g, '-');
    return PHASE_CONFIG[key] || { label: phase, color: '#78909c', progress: 10 };
}

function formatWeddingDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function getDaysUntil(dateStr?: string): string | null {
    if (!dateStr) return null;
    try {
        const target = new Date(dateStr);
        const now = new Date();
        const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Past';
        if (diff === 0) return 'Today';
        if (diff === 1) return '1 day away';
        return `${diff} days away`;
    } catch {
        return null;
    }
}

export function ProjectSelector() {
    const { activeProject, projects, setActiveProject, isLoading } = useProjects();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProjectSelect = (projectId: number) => {
        const selectedProject = projects.find(p => p.id === projectId);
        if (selectedProject) {
            setActiveProject(selectedProject);
        }
        handleMenuClose();
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={20} sx={{ color: 'primary.main' }} />
            </Box>
        );
    }

    const phaseInfo = getPhaseInfo(activeProject?.phase);
    const weddingDate = formatWeddingDate(activeProject?.wedding_date);
    const daysUntil = getDaysUntil(activeProject?.wedding_date);

    return (
        <Box sx={{ px: 1.5, py: 1.5 }}>
            {/* Label */}
            <Typography
                variant="caption"
                sx={{
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    letterSpacing: '1.2px',
                    mb: 1,
                    display: 'block',
                    px: 0.5,
                }}
            >
                Active Project
            </Typography>

            {/* Glassmorphism Card */}
            <Box
                sx={{
                    position: 'relative',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    // Glassmorphism effect
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, rgba(144, 202, 249, 0.08) 0%, rgba(206, 147, 216, 0.06) 100%)'
                            : 'linear-gradient(135deg, rgba(25, 118, 210, 0.06) 0%, rgba(156, 39, 176, 0.04) 100%)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid',
                    borderColor: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'rgba(144, 202, 249, 0.15)'
                            : 'rgba(25, 118, 210, 0.12)',
                    // Accent glow on the left
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        borderRadius: '3px 0 0 3px',
                        background: `linear-gradient(180deg, ${phaseInfo.color} 0%, rgba(144, 202, 249, 0.6) 100%)`,
                    },
                    transition: 'all 0.25s ease',
                    '&:hover': {
                        borderColor: (theme) =>
                            theme.palette.mode === 'dark'
                                ? 'rgba(144, 202, 249, 0.3)'
                                : 'rgba(25, 118, 210, 0.25)',
                        boxShadow: (theme) =>
                            theme.palette.mode === 'dark'
                                ? '0 4px 20px rgba(144, 202, 249, 0.08)'
                                : '0 4px 20px rgba(25, 118, 210, 0.06)',
                    },
                }}
            >
                {activeProject ? (
                    <Box sx={{ p: 1.5, pl: 2 }}>
                        {/* Top row: Project name + Switch button */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    component={Link}
                                    href={`/projects/${activeProject.id}`}
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        lineHeight: 1.3,
                                        color: 'text.primary',
                                        textDecoration: 'none',
                                        wordBreak: 'break-word',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            color: 'primary.main',
                                        },
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    {activeProject.project_name || `Project ${activeProject.id}`}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={handleMenuOpen}
                                sx={{
                                    mt: -0.25,
                                    mr: -0.5,
                                    color: 'text.secondary',
                                    opacity: 0.7,
                                    '&:hover': {
                                        opacity: 1,
                                        bgcolor: 'rgba(144, 202, 249, 0.1)',
                                    },
                                }}
                            >
                                <SwitchIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>

                        {/* Date row */}
                        {weddingDate && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                                <CalendarIcon sx={{ fontSize: 13, color: 'text.secondary', opacity: 0.7 }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    {weddingDate}
                                </Typography>
                                {daysUntil && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: phaseInfo.color,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            ml: 'auto',
                                        }}
                                    >
                                        {daysUntil}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {/* Phase badge + Progress */}
                        <Box sx={{ mt: 1.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Chip
                                    label={phaseInfo.label}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.3px',
                                        bgcolor: `${phaseInfo.color}20`,
                                        color: phaseInfo.color,
                                        border: `1px solid ${phaseInfo.color}40`,
                                        '& .MuiChip-label': { px: 1 },
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        fontSize: '0.6rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {phaseInfo.progress}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={phaseInfo.progress}
                                sx={{
                                    height: 3,
                                    borderRadius: 2,
                                    [`&.${linearProgressClasses.colorPrimary}`]: {
                                        bgcolor: (theme) =>
                                            theme.palette.mode === 'dark'
                                                ? 'rgba(255,255,255,0.06)'
                                                : 'rgba(0,0,0,0.06)',
                                    },
                                    [`& .${linearProgressClasses.bar}`]: {
                                        borderRadius: 2,
                                        background: `linear-gradient(90deg, ${phaseInfo.color}90, ${phaseInfo.color})`,
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                ) : (
                    /* No project selected state */
                    <Box
                        onClick={handleMenuOpen}
                        sx={{
                            p: 1.5,
                            pl: 2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <FolderIcon sx={{ fontSize: 18, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                fontSize: '0.8rem',
                                fontStyle: 'italic',
                            }}
                        >
                            Select a project...
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Project switch menu */}
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.5,
                            minWidth: 240,
                            maxWidth: 280,
                            maxHeight: 320,
                            borderRadius: 2,
                            backdropFilter: 'blur(12px)',
                            background: (theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'rgba(30, 30, 30, 0.95)'
                                    : 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid',
                            borderColor: 'divider',
                        },
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Switch Project
                    </Typography>
                </Box>
                {projects.length === 0 ? (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            No projects available
                        </Typography>
                    </MenuItem>
                ) : (
                    projects.map((project) => (
                        <MenuItem
                            key={project.id}
                            selected={project.id === activeProject?.id}
                            onClick={() => handleProjectSelect(project.id)}
                            sx={{
                                py: 1,
                                px: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(144, 202, 249, 0.1)',
                                    '&:hover': {
                                        bgcolor: 'rgba(144, 202, 249, 0.15)',
                                    },
                                },
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: project.id === activeProject?.id ? 600 : 400,
                                    fontSize: '0.8rem',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {project.project_name || `Project ${project.id}`}
                            </Typography>
                        </MenuItem>
                    ))
                )}
            </Menu>
        </Box>
    );
}
