import React from 'react';
import { Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import { Assignment as ProjectIcon } from '@mui/icons-material';
import { PROJECT_PHASES } from '../constants/project-phases';
import ProjectPhaseBar from './ProjectPhaseBar';

interface ProjectPhaseOverviewProps {
    currentPhase: string;
    onPhaseChange: (phaseId: string) => void;
    projectId: number;
}

const TASKS = [
    { title: 'Previous Task', subtitle: 'Client consultation completed', active: false },
    { title: 'Current Task', subtitle: 'Reviewing project requirements', active: true },
    { title: 'Next Task', subtitle: 'Creative brief development', active: false },
];

export default function ProjectPhaseOverview({ currentPhase, onPhaseChange, projectId }: ProjectPhaseOverviewProps) {
    const currentPhaseData = PROJECT_PHASES.find((phase) => phase.id === currentPhase) ?? PROJECT_PHASES[0];
    const IconComponent = currentPhaseData.icon || ProjectIcon;

    return (
        <Card sx={{ mt: 3, mb: 3, borderRadius: 3, background: 'rgba(16, 18, 22, 0.9)', border: '1px solid rgba(52, 58, 68, 0.3)' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <ProjectPhaseBar phases={PROJECT_PHASES} currentPhase={currentPhase} onPhaseChange={onPhaseChange} projectId={projectId} />
                </Box>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `2px solid ${currentPhaseData.color}40`, background: `linear-gradient(135deg, ${currentPhaseData.color}20, ${currentPhaseData.color}10)` }}>
                            <IconComponent sx={{ color: currentPhaseData.color }} />
                        </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#f1f5f9' }}>{currentPhaseData.name}</Typography>
                    <Typography variant="body1" sx={{ color: '#94a3b8' }}>{currentPhaseData.description}</Typography>
                </Box>

                <Grid container spacing={2}>
                    {TASKS.map((task) => (
                        <Grid item xs={12} md={4} key={task.title}>
                            <Box sx={{ textAlign: 'center', opacity: task.active ? 1 : 0.55 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: task.active ? '#60a5fa' : '#9ca3af', mb: 0.5 }}>{task.title}</Typography>
                                <Chip label={task.subtitle} size="small" sx={{ bgcolor: task.active ? 'rgba(59, 130, 246, 0.12)' : 'rgba(75, 85, 99, 0.12)', color: task.active ? '#bfdbfe' : '#cbd5e1' }} />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
}
