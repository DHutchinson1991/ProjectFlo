"use client";

import React from "react";
import {
    Box,
    Card,
    Typography,
    Chip,
} from "@mui/material";
import {
    Edit as EditIcon,
    Check as CheckIcon,
    Search as SearchIcon,
    Schedule as ScheduleIcon,
    Assignment as TaskIcon,
    Timer as TimerIcon,
    TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { TaskLibrary } from "@/lib/types/task-library";

interface PhaseCardsGridProps {
    phaseStats: Array<{
        phase: string;
        count: number;
        activeCount: number;
    }>;
    tasksByPhase: Record<string, TaskLibrary[]>;
    onPhaseCardClick: (phase: string) => void;
}

export const PhaseCardsGrid: React.FC<PhaseCardsGridProps> = ({
    phaseStats,
    tasksByPhase,
    onPhaseCardClick,
}) => {
    const phaseColors = {
        'Lead': {
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            icon: TrendingUpIcon,
            hoverColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: '#667eea',
            iconColor: '#667eea'
        },
        'Inquiry': {
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            icon: SearchIcon,
            hoverColor: 'rgba(240, 147, 251, 0.2)',
            borderColor: '#f093fb',
            iconColor: '#f093fb'
        },
        'Booking': {
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            icon: CheckIcon,
            hoverColor: 'rgba(79, 172, 254, 0.2)',
            borderColor: '#4facfe',
            iconColor: '#4facfe'
        },
        'Creative_Development': {
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            icon: EditIcon,
            hoverColor: 'rgba(67, 233, 123, 0.2)',
            borderColor: '#43e97b',
            iconColor: '#43e97b'
        },
        'Pre_Production': {
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            icon: ScheduleIcon,
            hoverColor: 'rgba(250, 112, 154, 0.2)',
            borderColor: '#fa709a',
            iconColor: '#fa709a'
        },
        'Production': {
            gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            icon: TaskIcon,
            hoverColor: 'rgba(33, 150, 243, 0.2)',
            borderColor: '#2196f3',
            iconColor: '#2196f3'
        },
        'Post_Production': {
            gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            icon: TimerIcon,
            hoverColor: 'rgba(156, 39, 176, 0.2)',
            borderColor: '#9c27b0',
            iconColor: '#9c27b0'
        },
        'Delivery': {
            gradient: 'linear-gradient(135deg, #ffeb3b 0%, #fbc02d 100%)',
            icon: CheckIcon,
            hoverColor: 'rgba(255, 235, 59, 0.2)',
            borderColor: '#ffeb3b',
            iconColor: '#ffeb3b'
        }
    };

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
                md: 'repeat(6, 1fr)',
                lg: 'repeat(8, 1fr)'
            },
            gap: 2,
            mb: 4
        }}>
            {phaseStats.map((phaseData) => {
                const phaseKey = phaseData.phase;
                const phaseCount = phaseData.count;
                const activeCount = phaseData.activeCount;
                const phaseTasks = tasksByPhase[phaseKey] || [];
                const totalHours = phaseTasks.reduce((sum, t) => sum + parseFloat(String(t.effort_hours || '0')), 0);

                const phaseStyle = phaseColors[phaseKey as keyof typeof phaseColors] || phaseColors['Lead'];
                const IconComponent = phaseStyle.icon;

                return (
                    <Card
                        key={phaseKey}
                        elevation={0}
                        onClick={() => onPhaseCardClick(phaseKey)}
                        sx={{
                            p: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 3,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            minHeight: '140px',
                            position: 'relative',
                            overflow: 'hidden',
                            background: `linear-gradient(135deg, ${phaseStyle.gradient.split(',')[0].split('(')[1]} 0%, ${phaseStyle.gradient.split(',')[1].split(')')[0]} 100%)`,
                            backgroundSize: '200% 200%',
                            opacity: 0.9,
                            '&:hover': {
                                borderColor: phaseStyle.borderColor,
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 25px ${phaseStyle.hoverColor}`,
                                opacity: 1,
                                backgroundPosition: 'right center',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: phaseStyle.hoverColor,
                                    zIndex: 1
                                }
                            }
                        }}
                    >
                        {/* Background Icon */}
                        <Box sx={{
                            position: 'absolute',
                            top: -10,
                            right: -10,
                            opacity: 0.2,
                            zIndex: 0
                        }}>
                            <IconComponent sx={{ fontSize: 60, color: phaseStyle.iconColor }} />
                        </Box>

                        {/* Content */}
                        <Box sx={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="subtitle2" sx={{
                                    fontWeight: 400,
                                    color: 'white',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                }}>
                                    {phaseKey.replace('_', ' ')}
                                </Typography>
                            </Box>

                            <Typography variant="body2" sx={{
                                color: 'rgba(255, 255, 255, 0.5)',
                                mb: 2,
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                                {phaseCount} tasks
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 'auto'
                            }}>
                                <Chip
                                    size="small"
                                    label={`${activeCount} active`}
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        color: 'rgba(0, 0, 0, 0.8)',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        boxShadow: 1
                                    }}
                                />
                                <Typography variant="body2" sx={{
                                    color: 'white',
                                    fontWeight: 400,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                }}>
                                    {totalHours.toFixed(1)}h
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                );
            })}
        </Box>
    );
};
