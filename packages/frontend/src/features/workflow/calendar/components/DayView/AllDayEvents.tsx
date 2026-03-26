import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    LocationOn as LocationIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { getEventColor } from '@/features/workflow/calendar/constants/calendar-config';

interface AllDayEventsProps {
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

const AllDayEvents: React.FC<AllDayEventsProps> = ({ events, onEventClick }) => {
    const allDayEvents = events.filter(e => e.allDay);
    if (allDayEvents.length === 0) return null;

    return (
        <Box sx={{ px: 2, pb: 1 }}>
            <Paper
                elevation={0}
                sx={{
                    background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 100%)',
                    border: '1px solid rgba(74,144,226,0.15)',
                    backdropFilter: 'blur(20px)',
                    p: 2,
                    position: 'relative',
                }}
            >
                <Typography variant="subtitle2" sx={{
                    mb: 1.5, fontWeight: 600, color: '#4A90E2',
                    textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem',
                }}>
                    All Day Events
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {allDayEvents.map(event => (
                        <Box
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            sx={{
                                p: 1.5, borderRadius: 2,
                                background: `linear-gradient(135deg,
                                    ${getEventColor(event.type)}CC 0%,
                                    ${getEventColor(event.type)}99 50%,
                                    ${getEventColor(event.type)}BB 100%)`,
                                border: `1px solid ${getEventColor(event.type)}55`,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(6px) saturate(1.1)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                                '&:hover': {
                                    background: `linear-gradient(135deg,
                                        ${getEventColor(event.type)}DD 0%,
                                        ${getEventColor(event.type)}AA 50%,
                                        ${getEventColor(event.type)}CC 100%)`,
                                    transform: 'translateY(-1px) scale(1.02)',
                                    boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${getEventColor(event.type)}66`,
                                    zIndex: 5,
                                },
                            }}
                        >
                            <Typography variant="subtitle2" sx={{
                                fontWeight: 600, color: '#ffffff',
                                textShadow: '0 1px 3px rgba(0,0,0,0.4)', mb: 0.5,
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }}>
                                {event.title}
                            </Typography>

                            {event.description && (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 0.5 }}>
                                    {event.description}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                {event.location && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocationIcon sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }} />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {event.location}
                                        </Typography>
                                    </Box>
                                )}
                                {event.assignee && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PersonIcon sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }} />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {event.assignee.name}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};

export default AllDayEvents;
