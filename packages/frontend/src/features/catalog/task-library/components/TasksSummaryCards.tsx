"use client";

import React from "react";
import {
    Box,
    Card,
    Typography,
} from "@mui/material";
import {
    Assignment as TaskIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";

interface TasksSummaryCardsProps {
    totalTasks: number;
    totalActive: number;
    phaseStats: Array<{
        phase: string;
        count: number;
        activeCount: number;
    }>;
}

export const TasksSummaryCards: React.FC<TasksSummaryCardsProps> = ({
    totalTasks,
    totalActive,
    phaseStats,
}) => {
    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 3
        }}>
            {/* Tasks Summary Card */}
            <Card
                elevation={0}
                sx={{
                    p: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.08) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background Icon */}
                <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    opacity: 0.1,
                    zIndex: 0
                }}>
                    <TaskIcon sx={{ fontSize: 120, color: 'primary.main' }} />
                </Box>

                <Box sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        boxShadow: 2
                    }}>
                        <TaskIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Tasks
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Comprehensive workflow coverage
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {totalActive} active • {totalTasks - totalActive} inactive
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h2" sx={{
                            fontWeight: 800,
                            lineHeight: 1,
                            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            mr: 1
                        }}>
                            {totalTasks}
                        </Typography>
                    </Box>
                </Box>
            </Card>

            {/* Phases Summary Card */}
            <Card
                elevation={0}
                sx={{
                    p: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(123, 31, 162, 0.08) 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background Icon */}
                <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    opacity: 0.1,
                    zIndex: 0
                }}>
                    <ScheduleIcon sx={{ fontSize: 120, color: 'secondary.main' }} />
                </Box>

                <Box sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        boxShadow: 2
                    }}>
                        <ScheduleIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Phases
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Organized workflow stages
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {phaseStats.length} phases • {phaseStats.filter(p => p.count > 0).length} active
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h2" sx={{
                            fontWeight: 800,
                            lineHeight: 1,
                            background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            mr: 1
                        }}>
                            {phaseStats.length}
                        </Typography>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};
