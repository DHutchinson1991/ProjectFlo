"use client";

import React from 'react';
import { Box, Button, ButtonGroup, alpha } from '@mui/material';
import { ViewModule, ViewWeek, ViewDay, ViewList } from '@mui/icons-material';
import { CalendarView } from '@/features/workflow/calendar/types/calendar-types';

interface ViewControlButtonsProps {
    currentView: CalendarView;
    onViewChange: (view: CalendarView) => void;
}

const viewButtons = [
    { type: 'month' as const, label: 'Month', icon: ViewModule },
    { type: 'week' as const, label: 'Week', icon: ViewWeek },
    { type: 'day' as const, label: 'Day', icon: ViewDay },
    { type: 'agenda' as const, label: 'Agenda', icon: ViewList },
];

const ViewControlButtons: React.FC<ViewControlButtonsProps> = ({ currentView, onViewChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ButtonGroup variant="outlined" size="small"
            sx={{
                '& .MuiButton-root': {
                    borderColor: alpha('#ffffff', 0.06),
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 500, textTransform: 'none',
                    minWidth: { xs: 36, sm: 60 }, height: 32, fontSize: '0.75rem',
                    color: alpha('#ffffff', 0.7), borderRadius: 1.5,
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:first-of-type': { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                    '&:last-of-type': { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                    '&:hover': {
                        backgroundColor: 'rgba(74,144,226,0.08)', borderColor: 'rgba(74,144,226,0.2)',
                        color: '#4A90E2', transform: 'translateY(-0.5px)', zIndex: 1,
                    },
                },
                '& .MuiButton-contained': {
                    background: 'linear-gradient(135deg, rgba(74,144,226,0.9), rgba(74,144,226,0.8))',
                    color: '#ffffff', borderColor: 'rgba(74,144,226,0.3)',
                    boxShadow: '0 2px 8px rgba(74,144,226,0.25)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, rgba(74,144,226,1), rgba(74,144,226,0.9))',
                        borderColor: 'rgba(74,144,226,0.4)', transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(74,144,226,0.35)',
                    },
                },
            }}>
            {viewButtons.map(({ type, label, icon: Icon }) => (
                <Button key={type}
                    onClick={() => onViewChange({ ...currentView, type })}
                    variant={currentView.type === type ? 'contained' : 'outlined'}
                    startIcon={<Icon sx={{ fontSize: '0.9rem' }} />}>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{label}</Box>
                </Button>
            ))}
        </ButtonGroup>
    </Box>
);

export default ViewControlButtons;
