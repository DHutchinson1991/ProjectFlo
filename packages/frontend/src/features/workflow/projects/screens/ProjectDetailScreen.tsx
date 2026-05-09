'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBrand } from '@/features/platform/brand';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Chip,
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { useProject } from '../hooks/useProject';
import { PROJECT_PHASE_TABS, PHASE_CONFIG_MAP } from '../constants/project-phases';
import type { ProjectTask } from '../types/project.types';
import { ProjectHeader } from '../components/project-header/ProjectHeader';
import { ProjectTab } from '../components/tabs/ProjectTab';
import { ProjectDiscoveryTab } from '../components/tabs/ProjectDiscoveryTab';
import { ProjectProposalTab } from '../components/tabs/ProjectProposalTab';
import { ProjectScheduleTab } from '../components/tabs/ProjectScheduleTab';
import { ProjectPhaseTab } from '../components/tabs/ProjectPhaseTab';

/* Tab IDs: 4 core + 6 phase tabs */
type ProjectTabId =
    | 'project'
    | 'discovery'
    | 'proposal'
    | 'schedule'
    | 'planning'
    | 'creative'
    | 'preproduction'
    | 'production'
    | 'postproduction'
    | 'delivery';

export default function ProjectDetailScreen() {
    const params = useParams();
    const projectId = parseInt(params.id as string);

    const { data: project, isLoading, error, refetch } = useProject(projectId);

    const [activeTab, setActiveTab] = useState<ProjectTabId>('project');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleRefresh = async () => {
        await refetch();
    };

    const handleSnackbar = (msg: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message: msg, severity });
    };

    /* ---- Task grouping by phase ---- */
    const tasksByPhase = useMemo(() => {
        const map = new Map<string, ProjectTask[]>();
        for (const task of project?.inquiry_tasks ?? []) {
            const phase = task.phase;
            if (!map.has(phase)) map.set(phase, []);
            map.get(phase)!.push(task);
        }
        return map;
    }, [project?.inquiry_tasks]);

    /* ---- Loading / error guards ---- */
    if (isLoading) {
        return (
            <Box sx={{ width: '100%', px: 3, py: 4 }}>
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" gap={2}>
                    <Box sx={{ position: 'relative' }}>
                        <CircularProgress size={48} thickness={3} sx={{ color: '#3b82f6' }} />
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Assignment sx={{ fontSize: 20, color: '#3b82f640' }} />
                        </Box>
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Loading project...</Typography>
                </Box>
            </Box>
        );
    }

    if (error) return <Box sx={{ width: '100%', px: 3, py: 4 }}><Alert severity="error">Failed to load project</Alert></Box>;
    if (!project) return <Box sx={{ width: '100%', px: 3, py: 4 }}><Alert severity="warning">Project not found</Alert></Box>;

    return (
        <Box sx={{ minHeight: '100vh', p: 3 }}>
            {/* --- PROJECT HEADER --- */}
            <ProjectHeader
                project={project}
                onRefresh={handleRefresh}
                onSnackbar={handleSnackbar}
            />

            {/* --- TABS --- */}
            <Box sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#64748b',
                            minHeight: 44,
                            '&.Mui-selected': {
                                color: '#3b82f6',
                            },
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            backgroundColor: '#3b82f6',
                        },
                    }}
                >
                    {/* Core tabs */}
                    <Tab label="Project" value="project" />
                    <Tab label="Discovery" value="discovery" />
                    <Tab label="Proposal" value="proposal" />
                    <Tab label="Schedule" value="schedule" />

                    {/* Phase tabs */}
                    {PROJECT_PHASE_TABS.map((phase) => (
                        <Tab
                            key={phase.tabId}
                            label={phase.name}
                            value={phase.tabId}
                            icon={
                                project.phase === phase.id ? (
                                    <Chip
                                        label="Current"
                                        size="small"
                                        sx={{
                                            height: 18,
                                            fontSize: '0.65rem',
                                            backgroundColor: phase.color + '20',
                                            color: phase.color,
                                            ml: 1,
                                        }}
                                    />
                                ) : undefined
                            }
                            iconPosition="end"
                        />
                    ))}
                </Tabs>
            </Box>

            {/* --- TAB CONTENT --- */}
            {activeTab === 'project' && (
                <ProjectTab project={project} onRefresh={handleRefresh} />
            )}

            {activeTab === 'discovery' && (
                <ProjectDiscoveryTab project={project} />
            )}

            {activeTab === 'proposal' && (
                <ProjectProposalTab project={project} onRefresh={handleRefresh} />
            )}

            {activeTab === 'schedule' && (
                <ProjectScheduleTab
                    projectId={project.id}
                    sourcePackageId={project.source_package_id}
                />
            )}

            {/* Phase tabs */}
            {PROJECT_PHASE_TABS.map((phase) =>
                activeTab === phase.tabId ? (
                    <ProjectPhaseTab
                        key={phase.tabId}
                        project={project}
                        phaseConfig={phase}
                        tasks={tasksByPhase.get(phase.id) ?? []}
                        onRefresh={handleRefresh}
                    />
                ) : null,
            )}

            {/* --- SNACKBAR --- */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                message={snackbar.message}
            />
        </Box>
    );
}
