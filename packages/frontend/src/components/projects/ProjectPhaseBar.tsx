import React from 'react';
import {
    Box,
    Typography,
    LinearProgress,
} from '@mui/material';

interface Phase {
    id: string;
    name: string;
    icon: React.ComponentType<{ sx?: object }>;
    color: string;
    description: string;
}

interface ProjectPhaseBarProps {
    phases: Phase[];
    currentPhase: string;
    onPhaseChange: (phaseId: string) => void;
    projectId: number;
    title?: string;
}

export default function ProjectPhaseBar({ phases, currentPhase, title = "Project Progress" }: ProjectPhaseBarProps) {
    const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase);
    const progressPercentage = ((currentPhaseIndex + 1) / phases.length) * 100;

    return (
        <Box sx={{ px: 3, py: 2 }}>
            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                        {Math.round(progressPercentage)}% Complete
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(52, 58, 68, 0.3)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
                        }
                    }}
                />
            </Box>
        </Box>
    );
}
