"use client";

import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Button,
    ButtonGroup,
    Chip,
    Tooltip,
    alpha,
    Paper,
    Stack,
    Divider
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    ViewModule,
    ViewWeek,
    ViewDay,
    ViewList,
    Notifications as NotificationIcon
} from '@mui/icons-material';
import { CalendarView } from '../types';
import { formatDate, isToday, addDays } from '../utils';

interface CalendarHeaderProps {
    currentView: CalendarView;
    onViewChange: (view: CalendarView) => void;
    onTodayClick: () => void;
    upcomingDeadlines: number;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentView,
    onViewChange,
    onTodayClick,
    upcomingDeadlines
}) => {

    const handlePrevious = () => {
        const { type, date } = currentView;
        let newDate: Date;

        switch (type) {
            case 'day':
                newDate = addDays(date, -1);
                break;
            case 'week':
                newDate = addDays(date, -7);
                break;
            case 'month':
                newDate = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate());
                break;
            case 'agenda':
                newDate = addDays(date, -30);
                break;
            default:
                newDate = date;
        }

        onViewChange({ ...currentView, date: newDate });
    };

    const handleNext = () => {
        const { type, date } = currentView;
        let newDate: Date;

        switch (type) {
            case 'day':
                newDate = addDays(date, 1);
                break;
            case 'week':
                newDate = addDays(date, 7);
                break;
            case 'month':
                newDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
                break;
            case 'agenda':
                newDate = addDays(date, 30);
                break;
            default:
                newDate = date;
        }

        onViewChange({ ...currentView, date: newDate });
    };

    const getDateDisplayText = () => {
        const { type, date } = currentView;

        switch (type) {
            case 'day':
                return formatDate(date);
            case 'week':
                const weekStart = addDays(date, -date.getDay());
                const weekEnd = addDays(weekStart, 6);
                return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
            case 'month':
                return {
                    month: date.toLocaleDateString('en-US', { month: 'long' }),
                    year: date.getFullYear().toString()
                };
            case 'agenda':
                return 'Upcoming Events & Tasks';
            default:
                return formatDate(date);
        }
    };

    const viewButtons = [
        { type: 'month' as const, label: 'Month', icon: ViewModule },
        { type: 'week' as const, label: 'Week', icon: ViewWeek },
        { type: 'day' as const, label: 'Day', icon: ViewDay },
        { type: 'agenda' as const, label: 'Agenda', icon: ViewList }
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                background: 'linear-gradient(135deg, rgba(10,10,10,0.98) 0%, rgba(26,26,26,0.95) 50%, rgba(15,15,15,0.98) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                borderBottom: `1px solid ${alpha('#4A90E2', 0.08)}`,
                borderRadius: 0,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(74,144,226,0.3), transparent)'
                }
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    p: { xs: 1.2, sm: 1.5 },
                    minHeight: 52
                }}
            >
                {/* Left side - Navigation and date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Navigation controls - Ultra sleek */}
                    <Stack direction="row" spacing={0.3}>
                        <Tooltip title="Previous" placement="bottom">
                            <IconButton
                                onClick={handlePrevious}
                                size="small"
                                sx={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${alpha('#ffffff', 0.05)}`,
                                    color: alpha('#ffffff', 0.7),
                                    borderRadius: 1.5,
                                    '&:hover': {
                                        backgroundColor: 'rgba(74,144,226,0.08)',
                                        borderColor: 'rgba(74,144,226,0.2)',
                                        color: '#4A90E2',
                                        transform: 'translateX(-1px) scale(1.05)'
                                    },
                                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <ChevronLeft fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Go to today" placement="bottom">
                            <Button
                                onClick={onTodayClick}
                                size="small"
                                variant="text"
                                sx={{
                                    minWidth: 65,
                                    height: 32,
                                    borderRadius: 1.5,
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    letterSpacing: '0.3px',
                                    background: isToday(currentView.date)
                                        ? 'linear-gradient(135deg, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0.15) 50%, rgba(74,144,226,0.2) 100%)'
                                        : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isToday(currentView.date)
                                        ? '#4A90E2'
                                        : alpha('#ffffff', 0.05)}`,
                                    color: isToday(currentView.date) ? '#4A90E2' : alpha('#ffffff', 0.7),
                                    '&:hover': {
                                        background: isToday(currentView.date)
                                            ? 'linear-gradient(135deg, rgba(74,144,226,0.35) 0%, rgba(74,144,226,0.25) 50%, rgba(74,144,226,0.3) 100%)'
                                            : 'rgba(74,144,226,0.08)',
                                        borderColor: '#4A90E2',
                                        color: '#4A90E2',
                                        transform: 'translateY(-0.5px) scale(1.02)'
                                    },
                                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                Today
                            </Button>
                        </Tooltip>

                        <Tooltip title="Next" placement="bottom">
                            <IconButton
                                onClick={handleNext}
                                size="small"
                                sx={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${alpha('#ffffff', 0.05)}`,
                                    color: alpha('#ffffff', 0.7),
                                    borderRadius: 1.5,
                                    '&:hover': {
                                        backgroundColor: 'rgba(74,144,226,0.08)',
                                        borderColor: 'rgba(74,144,226,0.2)',
                                        color: '#4A90E2',
                                        transform: 'translateX(1px) scale(1.05)'
                                    },
                                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <ChevronRight fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                            height: 28,
                            opacity: 0.1,
                            borderColor: '#ffffff'
                        }}
                    />

                    {/* Date display - Modern typography */}
                    <Box>
                        {currentView.type === 'month' ? (
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography
                                    variant="h5"
                                    component="h1"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: { xs: '1.1rem', sm: '1.4rem' },
                                        color: '#ffffff',
                                        letterSpacing: '-0.015em',
                                        lineHeight: 1,
                                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                    }}
                                >
                                    {(getDateDisplayText() as { month: string; year: string }).month}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    component="span"
                                    sx={{
                                        fontWeight: 300,
                                        fontSize: { xs: '0.9rem', sm: '1.1rem' },
                                        color: alpha('#ffffff', 0.6),
                                        letterSpacing: '-0.015em',
                                        lineHeight: 1,
                                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                    }}
                                >
                                    {(getDateDisplayText() as { month: string; year: string }).year}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography
                                variant="h5"
                                component="h1"
                                sx={{
                                    fontWeight: 600,
                                    fontSize: { xs: '1.1rem', sm: '1.4rem' },
                                    color: '#ffffff',
                                    letterSpacing: '-0.015em',
                                    lineHeight: 1,
                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                }}
                            >
                                {getDateDisplayText() as string}
                            </Typography>
                        )}
                        <Typography
                            variant="caption"
                            sx={{
                                color: alpha('#ffffff', 0.45),
                                fontWeight: 400,
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                                fontSize: '0.65rem',
                                mt: -0.2,
                                display: 'block'
                            }}
                        >
                            {currentView.type} view
                        </Typography>
                    </Box>
                </Box>

                {/* Center - Statistics - Minimalist */}
                <Stack direction="row" spacing={0.8} sx={{ display: { xs: 'none', lg: 'flex' } }}>
                    {upcomingDeadlines > 0 && (
                        <Chip
                            icon={<NotificationIcon sx={{ fontSize: '0.85rem !important', color: '#ffffff !important' }} />}
                            label={upcomingDeadlines}
                            size="small"
                            variant="filled"
                            sx={{
                                height: 28,
                                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                color: '#ffffff',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                borderRadius: 1.5,
                                border: 'none',
                                '& .MuiChip-label': {
                                    px: 1
                                },
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #d97706, #ea580c)',
                                    transform: 'translateY(-0.5px) scale(1.02)',
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                },
                                transition: 'all 0.15s ease'
                            }}
                        />
                    )}
                </Stack>

                {/* Right side - View controls - Compact and sleek */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ButtonGroup
                        variant="outlined"
                        size="small"
                        sx={{
                            '& .MuiButton-root': {
                                borderColor: alpha('#ffffff', 0.06),
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                backdropFilter: 'blur(8px)',
                                fontWeight: 500,
                                textTransform: 'none',
                                minWidth: { xs: 36, sm: 60 },
                                height: 32,
                                fontSize: '0.75rem',
                                color: alpha('#ffffff', 0.7),
                                borderRadius: 1.5,
                                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:first-of-type': {
                                    borderTopLeftRadius: 6,
                                    borderBottomLeftRadius: 6
                                },
                                '&:last-of-type': {
                                    borderTopRightRadius: 6,
                                    borderBottomRightRadius: 6
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(74,144,226,0.08)',
                                    borderColor: 'rgba(74,144,226,0.2)',
                                    color: '#4A90E2',
                                    transform: 'translateY(-0.5px)',
                                    zIndex: 1
                                }
                            },
                            '& .MuiButton-contained': {
                                background: 'linear-gradient(135deg, rgba(74,144,226,0.9), rgba(74,144,226,0.8))',
                                color: '#ffffff',
                                borderColor: 'rgba(74,144,226,0.3)',
                                boxShadow: '0 2px 8px rgba(74,144,226,0.25)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(74,144,226,1), rgba(74,144,226,0.9))',
                                    borderColor: 'rgba(74,144,226,0.4)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(74,144,226,0.35)'
                                }
                            }
                        }}
                    >
                        {viewButtons.map(({ type, label, icon: Icon }) => (
                            <Button
                                key={type}
                                onClick={() => onViewChange({ ...currentView, type })}
                                variant={currentView.type === type ? 'contained' : 'outlined'}
                                startIcon={<Icon sx={{ fontSize: '0.9rem' }} />}
                            >
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                    {label}
                                </Box>
                            </Button>
                        ))}
                    </ButtonGroup>
                </Box>
            </Box>
        </Paper>
    );
};

export default CalendarHeader;
