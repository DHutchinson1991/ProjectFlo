"use client";

import React from 'react';
import { Box, Typography, IconButton, Button, Tooltip, Stack, Divider, alpha } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { CalendarView } from '@/features/workflow/calendar/types/calendar-types';
import { formatDate, isToday, addDays } from '@/features/workflow/calendar/utils/calendar-date-helpers';

interface NavigationControlsProps {
    currentView: CalendarView;
    onViewChange: (view: CalendarView) => void;
    onTodayClick: () => void;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({ currentView, onViewChange, onTodayClick }) => {
    const handlePrevious = () => {
        const { type, date } = currentView;
        let newDate: Date;
        switch (type) {
            case 'day': newDate = addDays(date, -1); break;
            case 'week': newDate = addDays(date, -7); break;
            case 'month': newDate = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()); break;
            case 'agenda': newDate = addDays(date, -30); break;
            default: newDate = date;
        }
        onViewChange({ ...currentView, date: newDate });
    };

    const handleNext = () => {
        const { type, date } = currentView;
        let newDate: Date;
        switch (type) {
            case 'day': newDate = addDays(date, 1); break;
            case 'week': newDate = addDays(date, 7); break;
            case 'month': newDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate()); break;
            case 'agenda': newDate = addDays(date, 30); break;
            default: newDate = date;
        }
        onViewChange({ ...currentView, date: newDate });
    };

    const getDateDisplayText = () => {
        const { type, date } = currentView;
        switch (type) {
            case 'day': return formatDate(date);
            case 'week': {
                const weekStart = addDays(date, -date.getDay());
                const weekEnd = addDays(weekStart, 6);
                return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
            }
            case 'month': return {
                month: date.toLocaleDateString('en-US', { month: 'long' }),
                year: date.getFullYear().toString(),
            };
            case 'agenda': return 'Upcoming Events & Tasks';
            default: return formatDate(date);
        }
    };

    const navBtnSx = {
        width: 32, height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${alpha('#ffffff', 0.05)}`,
        color: alpha('#ffffff', 0.7),
        borderRadius: 1.5,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    const headingFontSx = {
        fontWeight: 600,
        fontSize: { xs: '1.1rem', sm: '1.4rem' },
        color: '#ffffff',
        letterSpacing: '-0.015em',
        lineHeight: 1,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Stack direction="row" spacing={0.3}>
                <Tooltip title="Previous" placement="bottom">
                    <IconButton onClick={handlePrevious} size="small"
                        sx={{ ...navBtnSx, '&:hover': { backgroundColor: 'rgba(74,144,226,0.08)', borderColor: 'rgba(74,144,226,0.2)', color: '#4A90E2', transform: 'translateX(-1px) scale(1.05)' } }}>
                        <ChevronLeft fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Go to today" placement="bottom">
                    <Button onClick={onTodayClick} size="small" variant="text"
                        sx={{
                            minWidth: 65, height: 32, borderRadius: 1.5, fontWeight: 500, fontSize: '0.75rem',
                            textTransform: 'none', letterSpacing: '0.3px',
                            background: isToday(currentView.date)
                                ? 'linear-gradient(135deg, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0.15) 50%, rgba(74,144,226,0.2) 100%)'
                                : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isToday(currentView.date) ? '#4A90E2' : alpha('#ffffff', 0.05)}`,
                            color: isToday(currentView.date) ? '#4A90E2' : alpha('#ffffff', 0.7),
                            '&:hover': {
                                background: isToday(currentView.date)
                                    ? 'linear-gradient(135deg, rgba(74,144,226,0.35) 0%, rgba(74,144,226,0.25) 50%, rgba(74,144,226,0.3) 100%)'
                                    : 'rgba(74,144,226,0.08)',
                                borderColor: '#4A90E2', color: '#4A90E2', transform: 'translateY(-0.5px) scale(1.02)',
                            },
                            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}>
                        Today
                    </Button>
                </Tooltip>
                <Tooltip title="Next" placement="bottom">
                    <IconButton onClick={handleNext} size="small"
                        sx={{ ...navBtnSx, '&:hover': { backgroundColor: 'rgba(74,144,226,0.08)', borderColor: 'rgba(74,144,226,0.2)', color: '#4A90E2', transform: 'translateX(1px) scale(1.05)' } }}>
                        <ChevronRight fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ height: 28, opacity: 0.1, borderColor: '#ffffff' }} />

            <Box>
                {currentView.type === 'month' ? (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h5" component="h1" sx={headingFontSx}>
                            {(getDateDisplayText() as { month: string; year: string }).month}
                        </Typography>
                        <Typography variant="h6" component="span"
                            sx={{ ...headingFontSx, fontWeight: 300, fontSize: { xs: '0.9rem', sm: '1.1rem' }, color: alpha('#ffffff', 0.6) }}>
                            {(getDateDisplayText() as { month: string; year: string }).year}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="h5" component="h1" sx={headingFontSx}>
                        {getDateDisplayText() as string}
                    </Typography>
                )}
                <Typography variant="caption" sx={{
                    color: alpha('#ffffff', 0.45), fontWeight: 400, letterSpacing: '0.4px',
                    textTransform: 'uppercase', fontSize: '0.65rem', mt: -0.2, display: 'block',
                }}>
                    {currentView.type} view
                </Typography>
            </Box>
        </Box>
    );
};

export default NavigationControls;
