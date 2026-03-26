"use client";

import React from 'react';
import { Box, Chip, Paper, Stack, alpha } from '@mui/material';
import { Notifications as NotificationIcon } from '@mui/icons-material';
import { CalendarView } from '@/features/workflow/calendar/types/calendar-types';
import NavigationControls from './NavigationControls';
import ViewControlButtons from './ViewControlButtons';

interface CalendarHeaderProps {
    currentView: CalendarView;
    onViewChange: (view: CalendarView) => void;
    onTodayClick: () => void;
    upcomingDeadlines: number;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentView, onViewChange, onTodayClick, upcomingDeadlines,
}) => (
    <Paper elevation={0}
        sx={{
            background: 'linear-gradient(135deg, rgba(10,10,10,0.98) 0%, rgba(26,26,26,0.95) 50%, rgba(15,15,15,0.98) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            borderBottom: `1px solid ${alpha('#4A90E2', 0.08)}`,
            borderRadius: 0, position: 'relative', overflow: 'hidden',
            '&::before': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(74,144,226,0.3), transparent)',
            },
        }}>
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 1.5, p: { xs: 1.2, sm: 1.5 }, minHeight: 52,
        }}>
            <NavigationControls currentView={currentView} onViewChange={onViewChange} onTodayClick={onTodayClick} />

            <Stack direction="row" spacing={0.8} sx={{ display: { xs: 'none', lg: 'flex' } }}>
                {upcomingDeadlines > 0 && (
                    <Chip
                        icon={<NotificationIcon sx={{ fontSize: '0.85rem !important', color: '#ffffff !important' }} />}
                        label={upcomingDeadlines} size="small" variant="filled"
                        sx={{
                            height: 28, background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                            color: '#ffffff', fontWeight: 500, fontSize: '0.75rem', borderRadius: 1.5, border: 'none',
                            '& .MuiChip-label': { px: 1 },
                            '&:hover': {
                                background: 'linear-gradient(135deg, #d97706, #ea580c)',
                                transform: 'translateY(-0.5px) scale(1.02)',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                            },
                            transition: 'all 0.15s ease',
                        }}
                    />
                )}
            </Stack>

            <ViewControlButtons currentView={currentView} onViewChange={onViewChange} />
        </Box>
    </Paper>
);

export default CalendarHeader;
