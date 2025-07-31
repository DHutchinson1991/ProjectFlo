import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarEvent, CalendarTask } from '../../types';
import { isToday, filterEventsByDate, filterTasksByDate } from '../../utils';
import { getEventColor } from '../../config';

interface WeekDayHeaderProps {
    day: Date;
    index: number;
    dayName: string;
    events: CalendarEvent[];
    tasks: CalendarTask[];
    onDateClick: (date: Date) => void;
    getDayTasks: (date: Date) => CalendarTask[];
}

const WeekDayHeader: React.FC<WeekDayHeaderProps> = ({
    day,
    index,
    dayName,
    events,
    tasks,
    onDateClick,
    getDayTasks
}) => {
    const isTodayDate = isToday(day);
    const dayEvents = filterEventsByDate(events, day);
    const dayTasks = getDayTasks(day);
    const isWeekday = index >= 0 && index <= 4;

    return (
        <Box
            key={day.toISOString()}
            onClick={() => {
                onDateClick(day);
            }}
            sx={{
                textAlign: 'center',
                position: 'relative',
                py: 1,
                px: 0.5,
                borderRadius: index === 6 ? '0 8px 0 0' : 0,
                height: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: isWeekday
                    ? 'linear-gradient(135deg, rgba(74,144,226,0.15) 0%, rgba(74,144,226,0.25) 50%, rgba(74,144,226,0.18) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderLeft: 'none',
                borderRight: index === 6 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    background: isWeekday
                        ? 'linear-gradient(135deg, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0.35) 50%, rgba(74,144,226,0.28) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.15) 100%)',
                    transform: 'translateY(-1px) scale(1.01)',
                    boxShadow: isWeekday
                        ? '0 4px 12px rgba(74,144,226,0.2), 0 0 0 1px rgba(74,144,226,0.4)'
                        : '0 4px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.2)'
                },
                ...(isTodayDate && {
                    background: 'linear-gradient(135deg, rgba(74,144,226,0.2) 0%, rgba(74,144,226,0.12) 50%, rgba(74,144,226,0.16) 100%)',
                    border: '1px solid #4A90E2',
                    borderLeft: 'none',
                    borderRight: index === 6 ? '1px solid #4A90E2' : 'none',
                    boxShadow: '0 6px 16px rgba(74,144,226,0.15), 0 0 8px rgba(74,144,226,0.1)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, transparent 30%, rgba(74,144,226,0.05) 50%, transparent 70%)',
                        animation: 'shimmer 4s ease-in-out infinite',
                        pointerEvents: 'none',
                        borderRadius: index === 6 ? '0 8px 0 0' : 0
                    }
                })
            }}
        >
            {/* Day name and date in a compact row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 600,
                        color: '#ffffff',
                        letterSpacing: 0.5,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        textShadow: isWeekday
                            ? '0 0 8px rgba(74,144,226,0.6), 0 1px 2px rgba(0,0,0,0.4)'
                            : '0 1px 3px rgba(0,0,0,0.6)',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        opacity: 0.95
                    }}
                >
                    {dayName}
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: isTodayDate ? 700 : 500,
                        color: isTodayDate ? '#4A90E2' : '#ffffff',
                        fontSize: isTodayDate ? '1.1rem' : '1rem',
                        textShadow: isTodayDate
                            ? '0 0 8px rgba(74,144,226,0.4), 0 1px 2px rgba(0,0,0,0.2)'
                            : '0 1px 2px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '-0.01em',
                        lineHeight: 1
                    }}
                >
                    {day.getDate()}
                </Typography>
            </Box>

            {/* Event and Task indicators - Compact */}
            {(dayEvents.length > 0 || dayTasks.length > 0) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25, flexWrap: 'wrap' }}>
                    {dayEvents.slice(0, 2).map((event, i) => (
                        <Box
                            key={`event-${i}`}
                            sx={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: getEventColor(event.type),
                                boxShadow: `0 0 4px ${getEventColor(event.type)}66`,
                                animation: 'pulse 2s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`
                            }}
                        />
                    ))}
                    {dayTasks.slice(0, 1).map((task, i) => (
                        <Box
                            key={`task-${i}`}
                            sx={{
                                width: 5,
                                height: 5,
                                borderRadius: 0.5,
                                background: task.completed
                                    ? 'linear-gradient(135deg, #2ed573 0%, #26d467 100%)'
                                    : task.priority === 'high'
                                        ? '#ff4757'
                                        : task.priority === 'medium'
                                            ? '#ffa502'
                                            : '#95a5a6',
                                boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default WeekDayHeader;
