import React from 'react';
import { Box, Grid } from '@mui/material';
import { Project } from '@/features/workflow/projects/types/project.types';
import ProjectDetailsForm from './ProjectDetailsForm';
import ProjectStatusSidebar from './ProjectStatusSidebar';

interface ProjectOverviewTabProps {
    project: Project;
    onRefresh: () => void;
}

export default function ProjectOverviewTab({ project, onRefresh }: ProjectOverviewTabProps) {
    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <ProjectDetailsForm project={project} onRefresh={onRefresh} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <ProjectStatusSidebar project={project} />
                </Grid>
            </Grid>
        </Box>
    );
}
