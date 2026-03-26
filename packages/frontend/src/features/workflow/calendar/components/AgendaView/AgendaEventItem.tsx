"use client";

import React from 'react';
import { Box, Typography, Chip, ListItem, ListItemText, ListItemIcon, alpha } from '@mui/material';
import { Event as EventIcon, Schedule, LocationOn, Person } from '@mui/icons-material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { formatTime } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { eventTypeConfig, priorityConfig } from '@/features/workflow/calendar/constants/calendar-config';

interface AgendaEventItemProps {
    event: CalendarEvent;
    onEventClick: (event: CalendarEvent) => void;
}

const AgendaEventItem: React.FC<AgendaEventItemProps> = ({ event, onEventClick }) => {
    const config = eventTypeConfig[event.type];
    const priorityConf = priorityConfig[event.priority];

    return (
        <ListItem
            onClick={() => onEventClick(event)}
            sx={{
                cursor: 'pointer', borderRadius: 1, mb: 1,
                backgroundColor: alpha(config.color, 0.05),
                border: `1px solid ${alpha(config.color, 0.2)}`,
                '&:hover': { backgroundColor: alpha(config.color, 0.1), transform: 'translateY(-2px)' },
            }}
        >
            <ListItemIcon>
                <EventIcon sx={{ color: config.color }} />
            </ListItemIcon>
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>{event.title}</Typography>
                        <Chip label={priorityConf.label} size="small"
                            sx={{ backgroundColor: priorityConf.color, color: 'white', height: 18, fontSize: '0.6rem' }} />
                        <Chip label={config.label} size="small" variant="outlined"
                            sx={{ borderColor: config.color, color: config.color, height: 18, fontSize: '0.6rem' }} />
                    </Box>
                }
                secondary={
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule sx={{ fontSize: 14 }} />
                                <Typography variant="caption">
                                    {event.allDay ? 'All Day' : `${formatTime(event.start)} - ${formatTime(event.end)}`}
                                </Typography>
                            </Box>
                            {event.location && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOn sx={{ fontSize: 14 }} />
                                    <Typography variant="caption">{event.location}</Typography>
                                </Box>
                            )}
                            {event.assignee && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Person sx={{ fontSize: 14 }} />
                                    <Typography variant="caption">{event.assignee.name}</Typography>
                                </Box>
                            )}
                        </Box>
                        {event.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {event.description}
                            </Typography>
                        )}
                    </Box>
                }
            />
        </ListItem>
    );
};

export default AgendaEventItem;
