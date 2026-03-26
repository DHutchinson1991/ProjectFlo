"use client";

import React from 'react';
import {
    Box, Paper, Typography, CircularProgress, Alert, IconButton,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { useCalendarEvents } from '@/features/workflow/calendar/hooks/use-calendar';
import { injectCalendarAnimations } from '@/features/workflow/calendar/constants/calendar-animations';
import { CalendarDragContext, DroppableTimeSlot } from '../DragAndDrop';
import { getDayData, formatHour } from '../../utils/day-view-utils';
import { useDayViewDrag } from '../../hooks/use-day-view-drag';
import DayDateHeader from './DayDateHeader';
import AllDayEvents from './AllDayEvents';
import TimelineEventCard from './TimelineEventCard';
import TasksPanel from './TasksPanel';

injectCalendarAnimations();

const hours = Array.from({ length: 24 }, (_, i) => i);

interface DayViewProps {
    date: Date;
    events?: CalendarEvent[];
    loading?: boolean;
    error?: string | null;
    onEventClick: (event: CalendarEvent) => void;
    onCreateEvent?: (eventData: { start: Date; end: Date; title: string }) => void;
    onEventUpdate?: (eventId: string, updateData: { start: Date; end: Date }) => Promise<void>;
    tasks?: CalendarTask[];
    onTaskClick?: (task: CalendarTask) => void;
}

const DayView: React.FC<DayViewProps> = ({
    date,
    events: passedEvents,
    loading: passedLoading,
    error: passedError,
    onEventClick,
    onCreateEvent,
    onEventUpdate,
    tasks = [],
    onTaskClick = () => {},
}) => {
    const { events: fetchedEvents, loading: fetchedLoading, error: fetchedError, refreshEvents } = useCalendarEvents(date, 'day');
    const events = passedEvents || fetchedEvents;
    const loading = passedLoading !== undefined ? passedLoading : fetchedLoading;
    const error = passedError !== undefined ? passedError : fetchedError;

    const { dragState, justFinishedDragging, activeEvent, handleDnDEnd, handleDragStart } =
        useDayViewDrag({ events, onEventUpdate });
    const { dayEvents, dayTasks, eventsWithLayout } = getDayData(events, tasks, date);

    const handleHourSlotClick = (hour: number) => {
        if (!onCreateEvent) return;
        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(hour + 1, 0, 0, 0);
        onCreateEvent({ start, end, title: `New Event ${formatHour(hour)}` });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center"
                sx={{ py: 8, background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', borderRadius: 2 }}>
                <CircularProgress sx={{ color: '#4A90E2', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                <Typography variant="body2" sx={{ ml: 2, color: '#e0e0e0' }}>
                    Loading events for {date.toLocaleDateString()}...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                <Alert severity="error"
                    sx={{ backgroundColor: '#2d1b1b', color: '#ffcdd2', '& .MuiAlert-icon': { color: '#ff5252' } }}
                    action={<IconButton color="inherit" size="small" onClick={refreshEvents} sx={{ color: '#ff5252' }}><RefreshIcon /></IconButton>}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <CalendarDragContext onDragEnd={handleDnDEnd} activeEvent={activeEvent}>
            <Box sx={{
                width: '100%', maxWidth: '100%',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                borderRadius: 4, display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
                position: 'relative', overflow: 'hidden',
                '&::before': {
                    content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(ellipse at top, rgba(74,144,226,0.03) 0%, transparent 50%)',
                    pointerEvents: 'none',
                },
            }}>
                <DayDateHeader date={date} events={events} dayEvents={dayEvents} dayTasks={dayTasks} refreshEvents={refreshEvents} />
                <AllDayEvents events={dayEvents} onEventClick={onEventClick} />

                <Box sx={{ display: 'flex', gap: 2, px: 2, pb: 2, flex: 1, overflow: 'hidden' }}>
                    {/* Hourly timeline */}
                    <Box sx={{ flex: dayTasks.length > 0 ? '1 1 65%' : '1 1 100%', minWidth: 0, overflow: 'hidden' }}>
                        <Paper elevation={0} sx={{
                            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
                            borderRadius: '0 0 12px 12px',
                            border: '1px solid rgba(74,144,226,0.15)',
                            borderTop: dayEvents.some(e => e.allDay) ? 'none' : '1px solid rgba(74,144,226,0.15)',
                            backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden',
                        }}>
                            <Box sx={{ position: 'relative' }}>
                                {eventsWithLayout.filter(ev => !ev.isAllDay).map(ev => (
                                    <TimelineEventCard key={ev.id} event={ev} dragState={dragState}
                                        justFinishedDragging={justFinishedDragging} onEventClick={onEventClick}
                                        onDragStart={handleDragStart} />
                                ))}

                                {hours.map(hour => {
                                    const hasEventsInSlot = eventsWithLayout.some(ev =>
                                        !ev.isAllDay && new Date(ev.start).getHours() <= hour && new Date(ev.end).getHours() > hour
                                    );
                                    return (
                                        <Box key={hour} sx={{ display: 'flex', minHeight: '80px', borderBottom: hour < 23 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                            <Box sx={{
                                                width: '100px', p: 1.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                                                background: 'linear-gradient(135deg, rgba(35,35,35,0.8) 0%, rgba(25,25,25,0.9) 100%)',
                                                borderRight: '1px solid rgba(74,144,226,0.1)',
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 500, color: 'rgba(255,255,255,0.7)', transform: 'translateY(-8px)',
                                                    fontSize: '0.8rem', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                }}>
                                                    {formatHour(hour)}
                                                    <Typography component="span" variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
                                                        (Click for {formatHour(hour)}-{formatHour(hour + 1)})
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            <DroppableTimeSlot date={date} hour={hour} onCreateEvent={onCreateEvent}>
                                                <Box onClick={() => handleHourSlotClick(hour)} sx={{
                                                    flex: 1, p: 0.75, minWidth: 0, overflow: 'visible', position: 'relative',
                                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(74,144,226,0.02)',
                                                        '&::after': {
                                                            content: '"+"', position: 'absolute', top: '50%',
                                                            ...(hasEventsInSlot
                                                                ? { right: '8px', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', fontSize: '0.9rem' }
                                                                : { left: '50%', transform: 'translate(-50%, -50%)', width: '28px', height: '28px', borderRadius: '50%', fontSize: '1rem' }),
                                                            color: '#ffffff', fontWeight: 700, backgroundColor: '#4A90E2',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '2px solid rgba(255,255,255,0.9)',
                                                            boxShadow: hasEventsInSlot
                                                                ? '0 3px 12px rgba(74,144,226,0.5), 0 0 0 1px rgba(74,144,226,0.3)'
                                                                : '0 4px 16px rgba(74,144,226,0.6), 0 0 0 1px rgba(74,144,226,0.4)',
                                                            zIndex: 10, transition: 'opacity 0.2s ease-out', opacity: 1,
                                                        },
                                                    },
                                                }} />
                                            </DroppableTimeSlot>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Box>

                    <TasksPanel tasks={dayTasks} onTaskClick={onTaskClick} />
                </Box>
            </Box>
        </CalendarDragContext>
    );
};

export default DayView;
