"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    Popper,
    Paper
} from '@mui/material';
import { CalendarEvent, CalendarTask } from '../types';
import {
    getCalendarDays,
    isToday,
    filterEventsByDate,
    filterTasksByDate,
    formatTime
} from '../utils';
import { useCalendarEvents } from '../hooks/useCalendar';
import { getEventColor } from '../config';

// CSS Animations for enhanced visual effects
const globalStyles = `
@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.05);
    }
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
        transform: translateX(200%) translateY(200%) rotate(45deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes skeletonPulse {
    0%, 100% {
        opacity: 0.3;
    }
    50% {
        opacity: 0.6;
    }
}
`;

// Inject global styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = globalStyles;
    document.head.appendChild(styleSheet);
}

interface MonthViewProps {
    date: Date;
    onDateClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    tasks?: CalendarTask[]; // Tasks are optional for now
    onTaskClick?: (task: CalendarTask) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
    date,
    onDateClick,
    onEventClick,
    tasks = [],
    onTaskClick = () => { }
}) => {
    const calendarDays = getCalendarDays(date, 1); // 1 = Monday start
    const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    // Use real calendar data
    const { events, loading, error, refreshEvents } = useCalendarEvents(date, 'month');

    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const [hoveredDayRef, setHoveredDayRef] = useState<HTMLElement | null>(null);

    const isCurrentMonth = (day: Date) => {
        return day.getMonth() === date.getMonth();
    };

    const getDayEvents = (day: Date) => {
        return filterEventsByDate(events, day).slice(0, 3); // Show max 3 events
    };

    const getDayTasks = (day: Date) => {
        return filterTasksByDate(tasks, day).slice(0, 2); // Show max 2 tasks
    };

    const getMoreCount = (day: Date) => {
        const dayEvents = filterEventsByDate(events, day);
        const dayTasks = filterTasksByDate(tasks, day);
        const shown = Math.min(dayEvents.length, 3) + Math.min(dayTasks.length, 2);
        const total = dayEvents.length + dayTasks.length;
        return total > shown ? total - shown : 0;
    };

    // Handle mouse events for day hover
    const handleMouseEnter = (day: Date, event: React.MouseEvent<HTMLElement>) => {
        setHoveredDay(day);
        setHoveredDayRef(event.currentTarget);
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
        setHoveredDayRef(null);
    };

    // Loading state
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                sx={{
                    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
                    borderRadius: 2
                }}
            >
                <CircularProgress
                    sx={{
                        color: '#64ffda',
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                        }
                    }}
                />
                <Typography variant="body2" sx={{ ml: 2, color: '#e0e0e0' }}>
                    Loading calendar events...
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                <Alert
                    severity="error"
                    sx={{
                        backgroundColor: '#2d1b1b',
                        color: '#ffcdd2',
                        '& .MuiAlert-icon': { color: '#ff5252' }
                    }}
                    action={
                        <IconButton
                            color="inherit"
                            size="small"
                            onClick={refreshEvents}
                            sx={{ color: '#ff5252' }}
                        >
                            <Typography variant="caption">Retry</Typography>
                        </IconButton>
                    }
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                height: '100%',
                width: '100%',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(ellipse at top, rgba(74,144,226,0.03) 0%, transparent 50%)',
                    pointerEvents: 'none'
                }
            }}
        >
            {/* Header Row with Days of Week */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 1.5,
                    mb: 2.5,
                    px: 2,
                    pt: 2,
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {weekDays.map((day, index) => (
                    <Box
                        key={day}
                        sx={{
                            textAlign: 'center',
                            position: 'relative',
                            py: 1.5,
                            px: 1,
                            borderRadius: 2,
                            background: index >= 0 && index <= 4
                                ? 'linear-gradient(135deg, rgba(74,144,226,0.2) 0%, rgba(74,144,226,0.35) 50%, rgba(74,144,226,0.25) 100%)'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 100%)',
                            border: index >= 0 && index <= 4
                                ? '1px solid rgba(74,144,226,0.4)'
                                : '1px solid rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                background: index >= 0 && index <= 4
                                    ? 'linear-gradient(135deg, rgba(74,144,226,0.3) 0%, rgba(74,144,226,0.45) 50%, rgba(74,144,226,0.35) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.15) 100%)',
                                transform: 'translateY(-2px) scale(1.02)',
                                boxShadow: index >= 0 && index <= 4
                                    ? '0 8px 20px rgba(74,144,226,0.3), 0 0 0 1px rgba(74,144,226,0.5)'
                                    : '0 8px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.3)'
                            }
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                color: index >= 0 && index <= 4 ? '#ffffff' : '#ffffff',
                                letterSpacing: 1.5,
                                fontSize: '0.85rem',
                                textTransform: 'uppercase',
                                textShadow: index >= 0 && index <= 4
                                    ? '0 0 20px rgba(74,144,226,0.8), 0 2px 4px rgba(0,0,0,0.6)'
                                    : '0 2px 6px rgba(0,0,0,0.8)',
                                transition: 'all 0.4s ease',
                                position: 'relative',
                                opacity: 1,
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}
                        >
                            {day}

                            {/* Enhanced accent for weekdays */}
                            {(index >= 0 && index <= 4) && (
                                <>
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: -3,
                                            right: -3,
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle, #4A90E2 0%, #357ABD 100%)',
                                            boxShadow: '0 0 10px rgba(74,144,226,0.8), 0 0 20px rgba(74,144,226,0.4)',
                                            opacity: 0.9,
                                            animation: 'pulse 3s ease-in-out infinite'
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: -12,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '80%',
                                            height: 3,
                                            background: 'linear-gradient(90deg, transparent, #4A90E2, transparent)',
                                            borderRadius: 2,
                                            boxShadow: '0 0 8px rgba(74,144,226,0.6)'
                                        }}
                                    />
                                </>
                            )}

                            {/* Subtle accent for weekends */}
                            {(index > 4) && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: -8,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '40%',
                                        height: 1,
                                        background: 'linear-gradient(90deg, transparent, rgba(224,224,224,0.3), transparent)',
                                        borderRadius: 1
                                    }}
                                />
                            )}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Calendar Grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridTemplateRows: 'repeat(6, 1fr)',
                    gap: 1.5,
                    flex: 1,
                    minHeight: 0,
                    position: 'relative',
                    zIndex: 1,
                    px: 2,
                    pb: 2
                }}
            >
                {calendarDays.map((day) => {
                    const dayEvents = getDayEvents(day);
                    const dayTasks = getDayTasks(day);
                    const moreCount = getMoreCount(day);
                    const isTodayDate = isToday(day);
                    const isCurrentMonthDate = isCurrentMonth(day);
                    const totalItems = dayEvents.length + dayTasks.length;

                    return (
                        <Box
                            key={day.toISOString()}
                            onMouseEnter={(e) => handleMouseEnter(day, e)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => onDateClick(day)}
                            sx={{
                                position: 'relative',
                                cursor: 'pointer',
                                borderRadius: 3,
                                overflow: 'hidden',
                                background: isTodayDate
                                    ? 'linear-gradient(135deg, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0.15) 50%, rgba(74,144,226,0.2) 100%)'
                                    : !isCurrentMonthDate
                                        ? 'linear-gradient(135deg, rgba(45,45,45,0.4) 0%, rgba(35,35,35,0.6) 50%, rgba(30,30,30,0.5) 100%)'
                                        : 'linear-gradient(135deg, rgba(50,50,50,0.7) 0%, rgba(30,30,30,0.9) 50%, rgba(25,25,25,0.8) 100%)',
                                border: isTodayDate
                                    ? '2px solid #4A90E2'
                                    : totalItems > 0 && isCurrentMonthDate
                                        ? '1px solid rgba(74,144,226,0.4)'
                                        : '1px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-3px) scale(1.03)',
                                    background: isTodayDate
                                        ? 'linear-gradient(135deg, rgba(74,144,226,0.35) 0%, rgba(74,144,226,0.25) 50%, rgba(74,144,226,0.3) 100%)'
                                        : 'linear-gradient(135deg, rgba(70,70,70,0.9) 0%, rgba(50,50,50,1) 50%, rgba(45,45,45,0.9) 100%)',
                                    boxShadow: isTodayDate
                                        ? '0 25px 50px rgba(74,144,226,0.4), 0 0 30px rgba(74,144,226,0.3), 0 0 0 1px rgba(74,144,226,0.5)'
                                        : '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.1), 0 0 0 1px rgba(74,144,226,0.3)',
                                    border: isTodayDate
                                        ? '2px solid #4A90E2'
                                        : '1px solid rgba(74,144,226,0.6)',
                                    zIndex: 10
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                p: 1.5,
                                minHeight: 0,
                                ...(isTodayDate && {
                                    boxShadow: '0 15px 30px rgba(74,144,226,0.2), 0 0 15px rgba(74,144,226,0.15)',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'linear-gradient(45deg, transparent 30%, rgba(74,144,226,0.08) 50%, transparent 70%)',
                                        animation: 'shimmer 4s ease-in-out infinite',
                                        pointerEvents: 'none'
                                    }
                                })
                            }}
                        >
                            {/* Day Number Header */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                    minHeight: 24
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: isTodayDate ? 600 : 200,
                                        color: isTodayDate
                                            ? '#4A90E2'
                                            : isCurrentMonthDate
                                                ? '#ffffff'
                                                : 'rgba(200,200,200,0.8)',
                                        fontSize: isTodayDate ? '1rem' : '.8rem',
                                        textShadow: isTodayDate
                                            ? '0 0 15px rgba(74,144,226,0.6), 0 2px 4px rgba(0,0,0,0.3)'
                                            : '0 2px 4px rgba(0,0,0,0.4)',
                                        position: 'relative',
                                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        letterSpacing: '-0.02em'
                                    }}
                                >
                                    {day.getDate()}
                                </Typography>
                            </Box>

                            {/* Events and Tasks Container */}
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                    minHeight: 0,
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Events */}
                                {dayEvents.map((event) => (
                                    <Box
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        sx={{
                                            height: 20,
                                            borderRadius: 2,
                                            background: `linear-gradient(135deg, 
                                                ${getEventColor(event.type)}CC 0%, 
                                                ${getEventColor(event.type)}99 50%,
                                                ${getEventColor(event.type)}BB 100%)`,
                                            cursor: 'pointer',
                                            opacity: isCurrentMonthDate ? 1 : 0.6,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            px: 1.5,
                                            position: 'relative',
                                            backdropFilter: 'blur(6px) saturate(1.1)',
                                            border: `1px solid ${getEventColor(event.type)}55`,
                                            boxShadow: `
                                                0 3px 8px rgba(0,0,0,0.12),
                                                0 1px 3px rgba(0,0,0,0.08),
                                                inset 0 1px 0 rgba(255,255,255,0.08)
                                            `,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, 
                                                    ${getEventColor(event.type)}DD 0%, 
                                                    ${getEventColor(event.type)}AA 50%,
                                                    ${getEventColor(event.type)}CC 100%)`,
                                                transform: 'translateY(-1px) scale(1.02)',
                                                zIndex: 5,
                                                boxShadow: `
                                                    0 6px 16px rgba(0,0,0,0.2),
                                                    0 2px 6px rgba(0,0,0,0.12),
                                                    inset 0 1px 0 rgba(255,255,255,0.12),
                                                    0 0 0 1px ${getEventColor(event.type)}66,
                                                    0 0 15px ${getEventColor(event.type)}33
                                                `,
                                                backdropFilter: 'blur(8px) saturate(1.2)'
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: '-100%',
                                                width: '100%',
                                                height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                                                transition: 'left 0.5s ease',
                                            },
                                            '&:hover::before': {
                                                left: '100%'
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: '#ffffff',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                letterSpacing: '0.02em',
                                                position: 'relative',
                                                zIndex: 1
                                            }}
                                        >
                                            {event.title}
                                        </Typography>
                                    </Box>
                                ))}

                                {/* More items indicator */}
                                {moreCount > 0 && (
                                    <Box
                                        sx={{
                                            mt: 0.5,
                                            height: 16,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 1.5,
                                            background: 'linear-gradient(135deg, rgba(74,144,226,0.15) 0%, rgba(74,144,226,0.08) 100%)',
                                            border: '1px dashed rgba(74,144,226,0.4)',
                                            backdropFilter: 'blur(4px)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0.15) 100%)',
                                                transform: 'scale(1.05)',
                                                border: '1px dashed rgba(74,144,226,0.6)',
                                                boxShadow: '0 4px 12px rgba(74,144,226,0.2), 0 0 8px rgba(74,144,226,0.1)'
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: '-100%',
                                                width: '100%',
                                                height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(74,144,226,0.2), transparent)',
                                                transition: 'left 0.4s ease',
                                            },
                                            '&:hover::before': {
                                                left: '100%'
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '0.65rem',
                                                color: 'rgba(74,144,226,0.9)',
                                                fontWeight: 600,
                                                opacity: isCurrentMonthDate ? 1 : 0.6,
                                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                letterSpacing: '0.02em',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                                position: 'relative',
                                                zIndex: 1
                                            }}
                                        >
                                            +{moreCount} more
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Task Checkboxes at Bottom */}
                            {dayTasks.length > 0 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 0.5,
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        mt: 1,
                                        pt: 0.75,
                                        borderTop: '1px solid rgba(74,144,226,0.3)'
                                    }}
                                >
                                    {dayTasks.map((task) => (
                                        <Box
                                            key={task.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTaskClick?.(task);
                                            }}
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 2,
                                                border: task.completed
                                                    ? 'none'
                                                    : task.priority === 'high'
                                                        ? '2px solid #ff4757'
                                                        : task.priority === 'medium'
                                                            ? '2px solid #ffa502'
                                                            : '2px solid #95a5a6',
                                                background: task.completed
                                                    ? 'linear-gradient(135deg, #2ed573 0%, #26d467 100%)'
                                                    : 'transparent',
                                                cursor: 'pointer',
                                                opacity: isCurrentMonthDate ? 1 : 0.6,
                                                transition: 'all 0.2s ease',
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                '&:hover': {
                                                    transform: 'scale(1.2)',
                                                    zIndex: 5
                                                },
                                                // Simple checkmark for completed tasks
                                                '&::after': task.completed ? {
                                                    content: '"✓"',
                                                    color: '#ffffff',
                                                    fontSize: '8px',
                                                    fontWeight: 'bold',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                                                } : {}
                                            }}
                                            title={`${task.title}${task.dueDate ? ` (Due: ${task.dueDate.toLocaleDateString()})` : ''} - ${task.completed ? 'Completed' : 'Pending'}`}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Hover Tooltip - Enhanced */}
            <Popper
                open={Boolean(hoveredDay && hoveredDayRef)}
                anchorEl={hoveredDayRef}
                placement="top"
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 8]
                        }
                    }
                ]}
                sx={{ zIndex: 9999 }}
            >
                <Paper
                    sx={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid rgba(74,144,226,0.3)',
                        maxWidth: 300,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            bottom: -8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid rgba(74,144,226,0.3)'
                        }
                    }}
                >
                    {hoveredDay && (
                        <>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#4A90E2', fontWeight: 700 }}>
                                {hoveredDay.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Typography>

                            {filterEventsByDate(events, hoveredDay).length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#e0e0e0' }}>
                                        � Events ({filterEventsByDate(events, hoveredDay).length})
                                    </Typography>
                                    {filterEventsByDate(events, hoveredDay).slice(0, 4).map(event => (
                                        <Box key={event.id} sx={{ display: 'flex', alignItems: 'center', pl: 1, mb: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 1,
                                                    background: getEventColor(event.type),
                                                    mr: 1,
                                                    flexShrink: 0
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#b0b0b0', fontSize: '0.7rem' }}>
                                                {event.title} {event.allDay ? '' : `at ${formatTime(event.start)}`}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {filterEventsByDate(events, hoveredDay).length > 4 && (
                                        <Typography variant="caption" sx={{ display: 'block', pl: 2.5, fontStyle: 'italic', color: '#888', fontSize: '0.65rem' }}>
                                            ... and {filterEventsByDate(events, hoveredDay).length - 4} more events
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {filterTasksByDate(tasks, hoveredDay).length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#e0e0e0' }}>
                                        ☑️ Tasks ({filterTasksByDate(tasks, hoveredDay).length})
                                    </Typography>
                                    {filterTasksByDate(tasks, hoveredDay).slice(0, 4).map(task => (
                                        <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', pl: 1, mb: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 1.5,
                                                    border: task.completed
                                                        ? 'none'
                                                        : task.priority === 'high'
                                                            ? '1.5px solid #ff5252'
                                                            : task.priority === 'medium'
                                                                ? '1.5px solid #ffb74d'
                                                                : '1.5px solid #ab47bc',
                                                    background: task.completed
                                                        ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                                                        : 'transparent',
                                                    mr: 1,
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '6px',
                                                    color: '#ffffff',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {task.completed ? '✓' : ''}
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: task.completed ? 'rgba(176, 176, 176, 0.7)' : '#b0b0b0',
                                                    fontSize: '0.7rem',
                                                    textDecoration: task.completed ? 'line-through' : 'none'
                                                }}
                                            >
                                                {task.title}
                                                {task.priority === 'high' && !task.completed && (
                                                    <Box component="span" sx={{ color: '#ff5252', ml: 0.5, fontSize: '0.6rem' }}>
                                                        (High Priority)
                                                    </Box>
                                                )}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {filterTasksByDate(tasks, hoveredDay).length > 4 && (
                                        <Typography variant="caption" sx={{ display: 'block', pl: 2.5, fontStyle: 'italic', color: '#888', fontSize: '0.65rem' }}>
                                            ... and {filterTasksByDate(tasks, hoveredDay).length - 4} more tasks
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {filterEventsByDate(events, hoveredDay).length === 0 && filterTasksByDate(tasks, hoveredDay).length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 1 }}>
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#888', fontSize: '0.7rem' }}>
                                        📅 No events or tasks scheduled
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Paper>
            </Popper>

            {/* Add shimmer animation styles via global CSS */}
        </Box>
    );
};

export default MonthView;
