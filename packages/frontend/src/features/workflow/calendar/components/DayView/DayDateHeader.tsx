import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { isToday } from '@/features/workflow/calendar/utils/calendar-date-helpers';

interface DayDateHeaderProps {
    date: Date;
    events: CalendarEvent[];
    dayEvents: CalendarEvent[];
    dayTasks: CalendarTask[];
    refreshEvents: () => void;
}

const DayDateHeader: React.FC<DayDateHeaderProps> = ({
    date, events, dayEvents, dayTasks, refreshEvents,
}) => (
    <Box sx={{ px: 2, pt: 2, pb: 1, position: 'relative', zIndex: 1 }}>
        <Paper
            elevation={0}
            sx={{
                background: isToday(date)
                    ? 'linear-gradient(135deg, rgba(74,144,226,0.15) 0%, rgba(74,144,226,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%)',
                border: `1px solid ${isToday(date) ? '#4A90E2' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px 12px 0 0',
                backdropFilter: 'blur(8px)',
                p: 2,
                position: 'relative',
                ...(isToday(date) && {
                    boxShadow: '0 6px 16px rgba(74,144,226,0.15), 0 0 8px rgba(74,144,226,0.1)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(45deg, transparent 30%, rgba(74,144,226,0.05) 50%, transparent 70%)',
                        animation: 'calShimmer 4s ease-in-out infinite',
                        pointerEvents: 'none',
                        borderRadius: '12px 12px 0 0',
                    },
                }),
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: isToday(date)
                        ? '0 0 8px rgba(74,144,226,0.4), 0 1px 2px rgba(0,0,0,0.2)'
                        : '0 1px 3px rgba(0,0,0,0.6)',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    mb: 1,
                }}
            >
                {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>

            {isToday(date) && (
                <Box
                    sx={{
                        display: 'inline-block', px: 2, py: 0.5, borderRadius: 2,
                        background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                        color: '#ffffff', fontSize: '0.8rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        boxShadow: '0 2px 8px rgba(74,144,226,0.3)', mb: 1,
                    }}
                >
                    Today
                </Box>
            )}

            {/* Event / Task Summary */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {events.length > 0 && dayEvents.length === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption" sx={{
                            color: '#ff9800', fontSize: '0.75rem', fontWeight: 600,
                            backgroundColor: 'rgba(255,152,0,0.1)', px: 1, py: 0.5,
                            borderRadius: 1, display: 'inline-block',
                        }}>
                            📅 {events.length} events found, but on different dates. Try navigating to see them.
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {[...new Set(events.map(e => new Date(e.start).toDateString()))].map(dateStr => (
                                <Typography key={dateStr} variant="caption" sx={{
                                    color: '#4A90E2', fontSize: '0.7rem',
                                    backgroundColor: 'rgba(74,144,226,0.1)',
                                    px: 0.5, py: 0.25, borderRadius: 0.5,
                                    border: '1px solid rgba(74,144,226,0.3)',
                                }}>
                                    📍 {dateStr}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}

                {dayEvents.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#4A90E2', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✅ Showing {dayEvents.length} events for {date.toDateString()}
                    </Typography>
                )}

                {dayEvents.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#4A90E2', boxShadow: '0 0 4px rgba(74,144,226,0.6)',
                            animation: 'calPulse 2s ease-in-out infinite',
                        }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                )}

                {dayTasks.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                            width: 8, height: 8, borderRadius: 0.5,
                            background: '#2ed573', boxShadow: '0 0 4px rgba(46,213,115,0.6)',
                            animation: 'calPulse 2s ease-in-out infinite', animationDelay: '0.5s',
                        }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                            {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                )}

                {dayEvents.length === 0 && dayTasks.length === 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                            No events or tasks scheduled
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={refreshEvents}
                            sx={{
                                color: '#4A90E2', backgroundColor: 'rgba(74,144,226,0.1)',
                                '&:hover': { backgroundColor: 'rgba(74,144,226,0.2)' },
                            }}
                            title="Refresh events"
                        >
                            <RefreshIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                    </Box>
                )}
            </Box>
        </Paper>
    </Box>
);

export default DayDateHeader;
