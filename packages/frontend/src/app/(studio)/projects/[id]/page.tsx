'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import {
    Assignment as ProjectIcon,
    Lightbulb as CreativeIcon,
    Build as PreProductionIcon,
    VideoCall as ProductionIcon,
    Edit as PostProductionIcon,
    LocalShipping as DeliveryIcon,
} from '@mui/icons-material';

// Import phase components
import ProjectPhaseBar from '../../../../components/projects/ProjectPhaseBar';
import ProjectOverviewTab from '../../../../components/projects/tabs/ProjectOverviewTab';
import CreativeDevelopmentTab from '../../../../components/projects/tabs/CreativeDevelopmentTab';
import { projectApiService } from '../services/projectApi';
import { Project } from '../types/project.types';
import PreProductionTab from '../../../../components/projects/tabs/PreProductionTab';
import ProductionTab from '../../../../components/projects/tabs/ProductionTab';
import PostProductionTab from '../../../../components/projects/tabs/PostProductionTab';
import DeliveryTab from '../../../../components/projects/tabs/DeliveryTab';

// Types

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

// Project phases configuration
const PROJECT_PHASES = [
    {
        id: 'overview',
        name: 'Overview',
        icon: ProjectIcon,
        color: '#6b7280',
        description: 'Project summary and details'
    },
    {
        id: 'creative',
        name: 'Creative Development',
        icon: CreativeIcon,
        color: '#8b5cf6',
        description: 'Creative planning and ideation'
    },
    {
        id: 'preproduction',
        name: 'Pre Production',
        icon: PreProductionIcon,
        color: '#f59e0b',
        description: 'Planning and preparation'
    },
    {
        id: 'production',
        name: 'Production',
        icon: ProductionIcon,
        color: '#ef4444',
        description: 'Filming and content creation'
    },
    {
        id: 'postproduction',
        name: 'Post Production',
        icon: PostProductionIcon,
        color: '#3b82f6',
        description: 'Editing and post-processing'
    },
    {
        id: 'delivery',
        name: 'Delivery',
        icon: DeliveryIcon,
        color: '#10b981',
        description: 'Final delivery and completion'
    }
];

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = parseInt(params.id as string);

    // State
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [currentPhase, setCurrentPhase] = useState<string>('overview');

    // Fetch project data
    const fetchProject = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await projectApiService.getProjectById(Number(projectId));
            setProject(data);

            // Set current phase from project data
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

    // Handle tab change
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    // Handle phase change
    const handlePhaseChange = (phaseId: string) => {
        setCurrentPhase(phaseId);
        // Also update the tab to match the phase
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
                {/* Breadcrumbs */}
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

                {/* Project Title */}
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

            {/* Current Phase and Task Overview */}
            <Box sx={{
                mt: 3,
                mb: 3
            }}>
                {/* Full Width Phase Overview */}
                <Box sx={{
                    background: 'rgba(16, 18, 22, 0.8)',
                    borderRadius: 3,
                    p: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                    width: '100%',
                    position: 'relative'
                }}>
                    {/* Progress Bar - Behind Icon */}
                    <Box sx={{
                        position: 'absolute',
                        top: '45%',
                        left: 0,
                        right: 0,
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                        px: 3,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: '45%',
                            right: '45%',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(16, 18, 22, 0.9) 30%, rgba(16, 18, 22, 0.95) 50%, rgba(16, 18, 22, 0.9) 70%, transparent 100%)',
                            zIndex: 2,
                            pointerEvents: 'none'
                        }
                    }}>
                        <ProjectPhaseBar
                            phases={PROJECT_PHASES}
                            currentPhase={currentPhase}
                            onPhaseChange={handlePhaseChange}
                            projectId={projectId}
                        />
                    </Box>

                    {/* Phase Header - Centered with Icon on Top */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 3,
                        position: 'relative',
                        zIndex: 3
                    }}>
                        {(() => {
                            const currentPhaseData = PROJECT_PHASES.find(p => p.id === currentPhase);
                            const IconComponent = currentPhaseData?.icon || ProjectIcon;
                            return (
                                <Box sx={{ textAlign: 'center' }}>
                                    {/* Phase Icon - On Top of Progress Bar */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        mb: 2
                                    }}>
                                        <Box sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${currentPhaseData?.color}20, ${currentPhaseData?.color}10)`,
                                            border: `2px solid ${currentPhaseData?.color}40`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: `0 4px 16px ${currentPhaseData?.color}20`,
                                            backgroundColor: 'rgba(16, 18, 22, 0.95)',
                                            position: 'relative',
                                            zIndex: 4
                                        }}>
                                            <IconComponent sx={{
                                                fontSize: 26,
                                                color: currentPhaseData?.color || '#6b7280'
                                            }} />
                                        </Box>
                                    </Box>

                                    {/* Phase Info */}
                                    <Typography variant="h5" sx={{
                                        fontWeight: 700,
                                        color: '#f1f5f9',
                                        mb: 1
                                    }}>
                                        {currentPhaseData?.name || 'Overview'}
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        color: '#94a3b8',
                                        mb: 0
                                    }}>
                                        {currentPhaseData?.description || 'Project overview and details'}
                                    </Typography>
                                </Box>
                            );
                        })()}
                    </Box>

                    {/* Tasks Row - Centered with Narrower Width */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 0,
                        position: 'relative',
                        zIndex: 3
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            maxWidth: '600px',
                            width: '100%'
                        }}>
                            {/* Previous Task */}
                            <Box sx={{
                                flex: '1',
                                textAlign: 'center',
                                opacity: 0.5,
                                transform: 'scale(0.9)'
                            }}>
                                <Typography variant="body2" sx={{
                                    fontWeight: 500,
                                    color: '#9ca3af',
                                    mb: 0.5
                                }}>
                                    Previous Task
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: '#6b7280',
                                    fontStyle: 'italic'
                                }}>
                                    Client consultation completed
                                </Typography>
                            </Box>

                            {/* Current Task - Wider */}
                            <Box sx={{
                                flex: '2.5',
                                textAlign: 'center'
                            }}>
                                <Box sx={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px dashed rgba(59, 130, 246, 0.3)',
                                    borderRadius: 2,
                                    p: 1.5,
                                    minHeight: '50px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <Typography variant="body2" sx={{
                                        fontWeight: 600,
                                        color: '#60a5fa',
                                        mb: 0.25
                                    }}>
                                        Current Task
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        color: '#94a3b8',
                                        fontStyle: 'italic'
                                    }}>
                                        Reviewing project requirements
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Next Task */}
                            <Box sx={{
                                flex: '1',
                                textAlign: 'center',
                                opacity: 0.5,
                                transform: 'scale(0.9)'
                            }}>
                                <Typography variant="body2" sx={{
                                    fontWeight: 500,
                                    color: '#9ca3af',
                                    mb: 0.5
                                }}>
                                    Next Task
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: '#6b7280',
                                    fontStyle: 'italic'
                                }}>
                                    Creative brief development
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

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
                    <CreativeDevelopmentTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    <PreProductionTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={3}>
                    <ProductionTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={4}>
                    <PostProductionTab project={project} onRefresh={fetchProject} />
                </TabPanel>
                <TabPanel value={activeTab} index={5}>
                    <DeliveryTab project={project} onRefresh={fetchProject} />
                </TabPanel>
            </Box>
        </Box>
    );
}
