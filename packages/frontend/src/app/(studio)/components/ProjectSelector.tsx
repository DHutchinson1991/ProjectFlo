"use client";

import React from 'react';
import {
    Box,
    FormControl,
    Select,
    MenuItem,
    Typography,
    CircularProgress,
} from '@mui/material';
import { useProjects } from '../providers/ProjectProvider';

export function ProjectSelector() {
    const { activeProject, projects, setActiveProject, isLoading } = useProjects();

    const handleProjectChange = (projectId: number) => {
        const selectedProject = projects.find(p => p.id === projectId);
        if (selectedProject) {
            setActiveProject(selectedProject);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    return (
        <Box sx={{ px: 2, py: 1 }}>
            <Typography
                variant="caption"
                sx={{
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px',
                    mb: 1,
                    display: 'block',
                }}
            >
                Active Project
            </Typography>

            <FormControl fullWidth size="small">
                <Select
                    value={activeProject?.id || ''}
                    onChange={(e) => handleProjectChange(Number(e.target.value))}
                    displayEmpty
                    sx={{
                        '& .MuiSelect-select': {
                            py: 1,
                            px: 1.5,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'divider',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                        },
                    }}
                >
                    {projects.length === 0 ? (
                        <MenuItem value="" disabled>
                            <Typography variant="body2" color="text.secondary">
                                No projects available
                            </Typography>
                        </MenuItem>
                    ) : (
                        projects.map((project) => (
                            <MenuItem key={project.id} value={project.id}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {project.project_name || `Project ${project.id}`}
                                </Typography>
                            </MenuItem>
                        ))
                    )}
                </Select>
            </FormControl>
        </Box>
    );
}
