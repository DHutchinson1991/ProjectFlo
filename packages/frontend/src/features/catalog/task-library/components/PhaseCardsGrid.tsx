"use client";

import React from "react";
import {
    Box,
    Card,
    Typography,
    Chip,
} from "@mui/material";
import { TaskLibrary } from "@/features/catalog/task-library/types";
import { getPhaseConfig, hexToRgba } from "@/shared/ui/tasks";
import { sumEffortHours } from "@/shared/utils/hours";

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
                const totalHours = sumEffortHours(phaseTasks);

                const cfg = getPhaseConfig(phaseKey);
                const IconComponent = cfg.icon;
                const gradient = `linear-gradient(135deg, ${cfg.color} 0%, ${hexToRgba(cfg.color, 0.7)} 100%)`;
                const hoverColor = hexToRgba(cfg.color, 0.2);

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
                            background: gradient,
                            backgroundSize: '200% 200%',
                            opacity: 0.9,
                            '&:hover': {
                                borderColor: cfg.color,
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 25px ${hoverColor}`,
                                opacity: 1,
                                backgroundPosition: 'right center',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: hoverColor,
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
                            <IconComponent sx={{ fontSize: 60, color: cfg.color }} />
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
