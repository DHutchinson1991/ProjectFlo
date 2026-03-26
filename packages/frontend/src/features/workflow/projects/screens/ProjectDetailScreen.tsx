'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Breadcrumbs,
    Link,
} from '@mui/material';
import { Assignment as ProjectIcon } from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types/project.types';
import { PROJECT_PHASES } from '../constants/project-phases';
import { ProjectPhaseOverview } from '../components';
import {
    ProjectOverviewTab,
    CreativeDevelopmentTab,
    PreProductionTab,
    ProductionTab,
    PostProductionTab,
    DeliveryTab,
    PackageScheduleTab,
} from '../components/tabs';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`project-tabpanel-${index}`}
            aria-labelledby={`project-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

interface ProjectDetailScreenProps {
    projectId: number;
}

export default function ProjectDetailScreen({ projectId }: ProjectDetailScreenProps) {
    const router = useRouter();
    const { getProjectById } = useProjects();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [currentPhase, setCurrentPhase] = useState<string>('overview');

    const fetchProject = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getProjectById(projectId);
            if (!data) {
                throw new Error('Project not found');
            }
            setProject(data);

            if (data.phase) {
                const phaseIndex = PROJECT_PHASES.findIndex(p => p.id === data.phase);
                if (phaseIndex !== -1) {
                    setCurrentPhase(data.phase);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch project data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handlePhaseChange = (phaseId: string) => {
        setCurrentPhase(phaseId);
        const phaseIndex = PROJECT_PHASES.findIndex(p => p.id === phaseId);
        if (phaseIndex !== -1) {
            setActiveTab(phaseIndex);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress size={60} sx={{ color: '#9ca3af' }} />
            </Box>
        );
    }

    if (error || !project) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {error || 'Project not found'}
                </Alert>
            </Box>
        );
    }

    const projectTitle = project.project_name || `${project.client?.contact?.first_name} ${project.client?.contact?.last_name} Wedding`;
    const weddingDate = new Date(project.wedding_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Box sx={{ minHeight: '100vh', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 2, opacity: 0.7 }}>
                    <Link
                        color="inherit"
                        onClick={() => router.push('/projects')}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main' },
                            transition: 'color 0.2s'
                        }}
                    >
                        Projects
                    </Link>
                    <Typography color="text.primary" fontWeight={600}>
                        {projectTitle}
                    </Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ProjectIcon sx={{ mr: 2, fontSize: 32, color: '#9ca3af' }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                            {projectTitle}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: '#94a3b8' }}>
                            Wedding Date: {weddingDate}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <ProjectPhaseOverview
                currentPhase={currentPhase}
                onPhaseChange={handlePhaseChange}
                projectId={projectId}
            />

            {/* Tab Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: 48,
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            textTransform: 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                                color: '#3b82f6'
                            },
                            '&.Mui-selected': {
                                color: '#3b82f6',
                                fontWeight: 600
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 2,
                            backgroundColor: '#3b82f6'
                        }
                    }}
                >
                    {PROJECT_PHASES.map((phase) => {
                        const IconComponent = phase.icon;
                        return (
                            <Tab
                                key={phase.id}
                                icon={<IconComponent />}
                                label={phase.name}
                                iconPosition="start"
                                sx={{
                                    minWidth: 140,
                                    '& .MuiTab-iconWrapper': {
                                        color: phase.color,
                                        marginRight: 1
                                    }
                                }}
                            />
                        );
                    })}
                </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ px: 3, pb: 3 }}>
                <TabPanel value={activeTab} index={0}>
                    <ProjectOverviewTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    <PackageScheduleTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    <CreativeDevelopmentTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={3}>
                    <PreProductionTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={4}>
                    <ProductionTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={5}>
                    <PostProductionTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={6}>
                    <DeliveryTab project={project} onRefresh={fetchProject} />
                </TabPanel>
            </Box>
        </Box>
    );
}
