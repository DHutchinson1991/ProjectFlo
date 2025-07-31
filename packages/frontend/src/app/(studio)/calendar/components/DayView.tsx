"use client";

import React, { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import {
    Schedule as ClockIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { CalendarEvent, CalendarTask } from '../types';
import { filterTasksByDate, filterEventsByDate, isToday, formatTime } from '../utils';
import { useCalendarEvents } from '../hooks/useCalendar';
import { getEventColor } from '../config';
import { CalendarDragContext, DraggableEvent, DroppableTimeSlot } from './DragAndDrop';
import { createDragDropHandler } from './dragDropUtils';

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

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// Inject global styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = globalStyles;
    document.head.appendChild(styleSheet);
}

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
    onTaskClick = () => { }
}) => {
    // Type for events with layout positioning
    type EventWithLayout = (typeof eventsWithPositions)[0] & {
        widthPercent?: number;
        leftPercent?: number;
    };

    // Use passed events if available, otherwise fetch them
    const { events: fetchedEvents, loading: fetchedLoading, error: fetchedError, refreshEvents } = useCalendarEvents(date, 'day');

    const events = passedEvents || fetchedEvents;
    const loading = passedLoading !== undefined ? passedLoading : fetchedLoading;
    const error = passedError !== undefined ? passedError : fetchedError;

    // Drag state for resizing events
    const [dragState, setDragState] = useState<{
        eventId: string;
        direction: 'top' | 'bottom';
        startY: number;
        originalStart: Date;
        originalEnd: Date;
        currentStart: Date | null;
        currentEnd: Date | null;
    } | null>(null);

    // Track if we just finished dragging to prevent click events
    const [justFinishedDragging, setJustFinishedDragging] = useState(false);

    // Drag and drop state for moving events to different times
    const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

    // Create drag and drop handler
    const dragDropHandler = useCallback(createDragDropHandler({
        onEventUpdate
    }), [onEventUpdate]);

    // Handle drag end for DnD
    const handleDnDEnd = useCallback(async (event: DragEndEvent) => {
        await dragDropHandler(event);
        setActiveEvent(null);
    }, [dragDropHandler]);

    // Drag handlers for event resizing
    const handleDragStart = useCallback((e: React.MouseEvent, event: CalendarEvent, direction: 'top' | 'bottom') => {
        e.stopPropagation();
        setDragState({
            eventId: event.id,
            direction,
            startY: e.clientY,
            originalStart: new Date(event.start),
            originalEnd: new Date(event.end),
            currentStart: null, // Don't set until there's actual movement
            currentEnd: null    // Don't set until there's actual movement
        });
    }, []);

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!dragState) return;

        const deltaY = e.clientY - dragState.startY;

        // Increase threshold to prevent small movements from triggering changes
        if (Math.abs(deltaY) < 10) {
            return;
        }

        // More precise calculation: start from exact original times, not rounded
        const minutesDelta = Math.round(deltaY / 80 * 60 / 15) * 15; // 80px per hour, snap to 15min intervals

        let newStart = new Date(dragState.originalStart);
        let newEnd = new Date(dragState.originalEnd);

        if (dragState.direction === 'top') {
            // Dragging top edge - adjust start time from original position
            newStart = new Date(dragState.originalStart.getTime() + minutesDelta * 60 * 1000);
            // Ensure minimum 15 minutes duration
            if (newStart >= dragState.originalEnd) {
                newStart = new Date(dragState.originalEnd.getTime() - 15 * 60 * 1000);
            }
        } else {
            // Dragging bottom edge - adjust end time from original position
            newEnd = new Date(dragState.originalEnd.getTime() + minutesDelta * 60 * 1000);
            // Ensure minimum 15 minutes duration
            if (newEnd <= dragState.originalStart) {
                newEnd = new Date(dragState.originalStart.getTime() + 15 * 60 * 1000);
            }
        }

        // Only update if the calculated times are actually different from originals
        if (newStart.getTime() !== dragState.originalStart.getTime() ||
            newEnd.getTime() !== dragState.originalEnd.getTime()) {
            setDragState(prev => prev ? {
                ...prev,
                currentStart: newStart,
                currentEnd: newEnd
            } : null);
        }
    }, [dragState]);

    const handleDragEnd = useCallback(async () => {
        if (!dragState || !dragState.currentStart || !dragState.currentEnd) return;

        // Set flag to prevent click events
        setJustFinishedDragging(true);

        try {
            // Find the event and update it
            const eventToUpdate = events.find(e => e.id === dragState.eventId);
            if (eventToUpdate && onEventUpdate) {
                console.log('Event resized:', {
                    id: eventToUpdate.id,
                    title: eventToUpdate.title,
                    originalStart: dragState.originalStart,
                    originalEnd: dragState.originalEnd,
                    newStart: dragState.currentStart,
                    newEnd: dragState.currentEnd
                });

                // Call the update function passed from parent (which handles optimistic updates)
                await onEventUpdate(eventToUpdate.id, {
                    start: dragState.currentStart,
                    end: dragState.currentEnd
                });

                console.log('✅ Event updated successfully');
            }
        } catch (error) {
            console.error('❌ Error updating event:', error);
            // Note: Don't call refreshEvents here - let the parent handle any error recovery
        } finally {
            setDragState(null);
            // Clear the flag after a short delay to allow the click event to be prevented
            setTimeout(() => setJustFinishedDragging(false), 100);
        }
    }, [dragState, events, onEventUpdate]);

    // Add global mouse event listeners for dragging
    React.useEffect(() => {
        if (dragState) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.body.style.cursor = dragState.direction === 'top' ? 'n-resize' : 's-resize';
            document.body.style.userSelect = 'none';

            return () => {
                document.removeEventListener('mousemove', handleDragMove);
                document.removeEventListener('mouseup', handleDragEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [dragState, handleDragMove, handleDragEnd]);

    // Generate hours for the day (24-hour format)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Filter events and tasks for this specific date
    const dayEvents = filterEventsByDate(events, date);
    const dayTasks = filterTasksByDate(tasks, date);

    // Sort events by start time
    const sortedEvents = [...dayEvents].sort((a, b) => {
        const timeA = new Date(a.start).getTime();
        const timeB = new Date(b.start).getTime();
        return timeA - timeB;
    });

    // Calculate event positioning for seamless spanning
    const eventsWithPositions = sortedEvents.map(event => {
        if (event.allDay) {
            return {
                ...event,
                top: 0,
                height: 60, // All-day events get special handling
                isAllDay: true
            };
        }

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Calculate position in minutes from start of day
        const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
        const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
        const durationMinutes = endMinutes - startMinutes;

        // Each hour slot is 80px tall (you can adjust this based on your CSS)
        const pixelsPerMinute = 80 / 60; // 80px per hour / 60 minutes

        return {
            ...event,
            top: startMinutes * pixelsPerMinute,
            height: Math.max(durationMinutes * pixelsPerMinute, 20), // Minimum 20px height
            isAllDay: false,
            startMinutes,
            endMinutes
        };
    });

    // Group overlapping events for side-by-side positioning
    const groupOverlappingEvents = (events: typeof eventsWithPositions) => {
        const nonAllDayEvents = events.filter(event => !event.allDay);
        const groups: (typeof eventsWithPositions)[] = [];

        nonAllDayEvents.forEach(event => {
            let addedToGroup = false;
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            for (const group of groups) {
                // Check if this event overlaps with any event in the group
                const overlaps = group.some(groupEvent => {
                    const groupEventStart = new Date(groupEvent.start);
                    const groupEventEnd = new Date(groupEvent.end);
                    return eventStart < groupEventEnd && eventEnd > groupEventStart;
                });

                if (overlaps) {
                    group.push(event);
                    addedToGroup = true;
                    break;
                }
            }

            if (!addedToGroup) {
                groups.push([event]);
            }
        });

        return groups;
    };

    // Calculate positions for overlapping events
    const eventGroups = groupOverlappingEvents(eventsWithPositions);
    const eventsWithLayout: EventWithLayout[] = eventsWithPositions.map(event => {
        if (event.allDay) return { ...event, widthPercent: 100, leftPercent: 0 };

        // Find which group this event belongs to
        const group = eventGroups.find(g => g.some(e => e.id === event.id));
        if (!group || group.length === 1) {
            return { ...event, widthPercent: 100, leftPercent: 0 };
        }

        // Calculate width and position for overlapping events
        const eventIndex = group.findIndex(e => e.id === event.id);
        const totalEvents = group.length;
        const widthPercent = 100 / totalEvents;
        const leftPercent = (eventIndex / totalEvents) * 100;

        return {
            ...event,
            widthPercent,
            leftPercent
        };
    });

    // Handle click on empty hour slot to create event
    const handleHourSlotClick = (hour: number) => {
        if (!onCreateEvent) return;

        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);

        const defaultTitle = `New Event ${formatHour(hour)}`;

        onCreateEvent({
            start: startTime,
            end: endTime,
            title: defaultTitle
        });
    };

    // Format hour display
    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    // Loading state
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                    py: 8,
                    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
                    borderRadius: 2
                }}
            >
                <CircularProgress
                    sx={{
                        color: '#4A90E2',
                        '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                        }
                    }}
                />
                <Typography variant="body2" sx={{ ml: 2, color: '#e0e0e0' }}>
                    Loading events for {date.toLocaleDateString()}...
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 8 }}>
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
                            <RefreshIcon />
                        </IconButton>
                    }
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <CalendarDragContext
            onDragEnd={handleDnDEnd}
            activeEvent={activeEvent}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '100%',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
                    position: 'relative',
                    overflow: 'hidden', // Prevent horizontal scrolling
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
                {/* Date Header */}
                <Box
                    sx={{
                        px: 2,
                        pt: 2,
                        pb: 1,
                        position: 'relative',
                        zIndex: 1
                    }}
                >
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
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(45deg, transparent 30%, rgba(74,144,226,0.05) 50%, transparent 70%)',
                                    animation: 'shimmer 4s ease-in-out infinite',
                                    pointerEvents: 'none',
                                    borderRadius: '12px 12px 0 0'
                                }
                            })
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
                                mb: 1
                            }}
                        >
                            {date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Typography>

                        {isToday(date) && (
                            <Box
                                sx={{
                                    display: 'inline-block',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                                    color: '#ffffff',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    boxShadow: '0 2px 8px rgba(74,144,226,0.3)',
                                    mb: 1
                                }}
                            >
                                Today
                            </Box>
                        )}

                        {/* Event Summary */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Event summary with helpful navigation info */}
                            {events.length > 0 && dayEvents.length === 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="caption" sx={{
                                        color: '#ff9800',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: 'rgba(255,152,0,0.1)',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        display: 'inline-block'
                                    }}>
                                        📅 {events.length} events found, but on different dates. Try navigating to see them.
                                    </Typography>

                                    {/* Show which dates have events */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {[...new Set(events.map(e => new Date(e.start).toDateString()))].map(dateStr => (
                                            <Typography
                                                key={dateStr}
                                                variant="caption"
                                                sx={{
                                                    color: '#4A90E2',
                                                    fontSize: '0.7rem',
                                                    backgroundColor: 'rgba(74,144,226,0.1)',
                                                    px: 0.5,
                                                    py: 0.25,
                                                    borderRadius: 0.5,
                                                    border: '1px solid rgba(74,144,226,0.3)'
                                                }}
                                            >
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
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: '#4A90E2',
                                            boxShadow: '0 0 4px rgba(74,144,226,0.6)',
                                            animation: 'pulse 2s ease-in-out infinite'
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            )}
                            {dayTasks.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 0.5,
                                            background: '#2ed573',
                                            boxShadow: '0 0 4px rgba(46,213,115,0.6)',
                                            animation: 'pulse 2s ease-in-out infinite',
                                            animationDelay: '0.5s'
                                        }}
                                    />
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

                                    {/* Debug refresh button */}
                                    <IconButton
                                        size="small" onClick={() => {
                                            refreshEvents();
                                        }}
                                        sx={{
                                            color: '#4A90E2',
                                            backgroundColor: 'rgba(74,144,226,0.1)',
                                            '&:hover': { backgroundColor: 'rgba(74,144,226,0.2)' }
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

                {/* All-day Events Section */}
                {dayEvents.some(event => event.allDay) && (
                    <Box sx={{ px: 2, pb: 1 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 100%)',
                                border: '1px solid rgba(74,144,226,0.15)',
                                backdropFilter: 'blur(20px)',
                                p: 2,
                                position: 'relative'
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 1.5,
                                    fontWeight: 600,
                                    color: '#4A90E2',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    fontSize: '0.8rem'
                                }}
                            >
                                All Day Events
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {dayEvents
                                    .filter(event => event.allDay)
                                    .map(event => (
                                        <Box
                                            key={event.id}
                                            onClick={() => onEventClick(event)}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                background: `linear-gradient(135deg, 
                                                ${getEventColor(event.type)}CC 0%, 
                                                ${getEventColor(event.type)}99 50%,
                                                ${getEventColor(event.type)}BB 100%)`,
                                                border: `1px solid ${getEventColor(event.type)}55`,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                backdropFilter: 'blur(6px) saturate(1.1)',
                                                boxShadow: `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
                                                '&:hover': {
                                                    background: `linear-gradient(135deg, 
                                                    ${getEventColor(event.type)}DD 0%, 
                                                    ${getEventColor(event.type)}AA 50%,
                                                    ${getEventColor(event.type)}CC 100%)`,
                                                    transform: 'translateY(-1px) scale(1.02)',
                                                    boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${getEventColor(event.type)}66`,
                                                    zIndex: 5
                                                }
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: '#ffffff',
                                                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                                    mb: 0.5,
                                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                                }}
                                            >
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
                                    ))
                                }
                            </Box>
                        </Paper>
                    </Box>
                )}

                {/* Hourly Timeline */}
                <Box sx={{ px: 2, pb: 2, flex: 1, overflow: 'hidden' }}>
                    <Paper
                        elevation={0}
                        sx={{
                            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
                            borderRadius: dayEvents.some(event => event.allDay) ? '0 0 12px 12px' : '0 0 12px 12px',
                            border: '1px solid rgba(74,144,226,0.15)',
                            borderTop: dayEvents.some(event => event.allDay) ? 'none' : '1px solid rgba(74,144,226,0.15)',
                            backdropFilter: 'blur(20px)',
                            position: 'relative',
                            overflow: 'hidden' // Prevent horizontal scrolling in timeline
                        }}
                    >
                        <Box sx={{ position: 'relative' }}>
                            {/* Seamless events rendered with absolute positioning */}
                            {eventsWithLayout.filter(event => !event.allDay).map((event) => {
                                // Calculate width and left position for overlapping events
                                // Reserve 40px space on the right for plus button
                                const eventContainerWidth = 'calc(100% - 148px)'; // Total available width after hour label (100px) + plus button space (40px) + padding (8px)
                                const eventWidth = event.widthPercent ? `calc(${eventContainerWidth} * ${event.widthPercent / 100})` : eventContainerWidth;
                                const eventLeft = event.leftPercent ? `calc(100px + ${eventContainerWidth} * ${event.leftPercent / 100})` : '100px';

                                // Check if this event is being dragged
                                const isBeingDragged = dragState?.eventId === event.id;

                                // Only use drag state if there are actual changes to start/end times
                                const hasActualChanges = isBeingDragged &&
                                    dragState.currentStart !== null &&
                                    dragState.currentEnd !== null && (
                                        dragState.currentStart.getTime() !== dragState.originalStart.getTime() ||
                                        dragState.currentEnd.getTime() !== dragState.originalEnd.getTime()
                                    );

                                const currentEvent = hasActualChanges ? {
                                    ...event,
                                    start: dragState.currentStart!,
                                    end: dragState.currentEnd!
                                } : event;

                                // Recalculate position if being dragged with actual changes
                                const startMinutes = currentEvent.start.getHours() * 60 + currentEvent.start.getMinutes();
                                const endMinutes = currentEvent.end.getHours() * 60 + currentEvent.end.getMinutes();
                                const durationMinutes = endMinutes - startMinutes;
                                const pixelsPerMinute = 80 / 60; // 80px per hour
                                const currentTop = startMinutes * pixelsPerMinute;
                                const currentHeight = Math.max(durationMinutes * pixelsPerMinute, 20); // Minimum 20px height

                                return (
                                    <DraggableEvent key={event.id} event={event}>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: eventLeft,
                                                width: eventWidth,
                                                top: `${hasActualChanges ? currentTop : event.top}px`,
                                                height: `${hasActualChanges ? currentHeight : event.height}px`,
                                                borderRadius: 2,
                                                background: `linear-gradient(135deg, 
                                                ${getEventColor(event.type)}CC 0%, 
                                                ${getEventColor(event.type)}99 50%,
                                                ${getEventColor(event.type)}BB 100%)`,
                                                border: `1px solid ${getEventColor(event.type)}55`,
                                                cursor: isBeingDragged ? 'grabbing' : 'pointer',
                                                transition: isBeingDragged ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                backdropFilter: 'blur(6px) saturate(1.1)',
                                                boxShadow: hasActualChanges
                                                    ? `0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 2px ${getEventColor(event.type)}99`
                                                    : `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
                                                zIndex: hasActualChanges ? 10 : 2,
                                                transform: hasActualChanges ? 'scale(1.02)' : 'none',
                                                opacity: hasActualChanges ? 0.9 : 1,
                                                '&:hover': !isBeingDragged ? {
                                                    background: `linear-gradient(135deg, 
                                                    ${getEventColor(event.type)}DD 0%, 
                                                    ${getEventColor(event.type)}AA 50%,
                                                    ${getEventColor(event.type)}CC 100%)`,
                                                    transform: 'translateY(-1px) scale(1.01)',
                                                    boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${getEventColor(event.type)}66`,
                                                    zIndex: 3
                                                } : {},
                                                overflow: 'hidden'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isBeingDragged && !justFinishedDragging) {
                                                    onEventClick(event);
                                                }
                                            }}
                                        >
                                            {/* Top drag handle */}
                                            <Box
                                                onMouseDown={(e) => handleDragStart(e, event, 'top')}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '8px',
                                                    cursor: 'n-resize',
                                                    zIndex: 5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s ease',
                                                    '&:hover': {
                                                        opacity: 1,
                                                        backgroundColor: 'rgba(255,255,255,0.2)'
                                                    },
                                                    '&::after': {
                                                        content: '""',
                                                        width: '20px',
                                                        height: '2px',
                                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                                        borderRadius: '1px'
                                                    }
                                                }}
                                            />

                                            {/* Event content */}
                                            <Box sx={{ p: 1, height: 'calc(100% - 16px)', position: 'relative', zIndex: 1, marginTop: '8px' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <ClockIcon sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }} />
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                        {formatTime(event.start)}
                                                        {event.end && ` - ${formatTime(event.end)}`}
                                                    </Typography>
                                                </Box>

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600,
                                                        color: '#ffffff',
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                        letterSpacing: '0.01em',
                                                        lineHeight: 1.3,
                                                        mb: event.height > 60 ? 0.25 : 0
                                                    }}
                                                >
                                                    {event.title}
                                                </Typography>

                                                {event.description && event.height > 60 && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: 'rgba(255,255,255,0.85)',
                                                            mb: 0.5,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {event.description}
                                                    </Typography>
                                                )}

                                                {event.height > 80 && (
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        {event.location && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <LocationIcon sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }} />
                                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                                                                    {event.location}
                                                                </Typography>
                                                            </Box>
                                                        )}

                                                        {event.assignee && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <PersonIcon sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }} />
                                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                                                                    {event.assignee.name}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* Bottom drag handle */}
                                            <Box
                                                onMouseDown={(e) => handleDragStart(e, event, 'bottom')}
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '8px',
                                                    cursor: 's-resize',
                                                    zIndex: 5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s ease',
                                                    '&:hover': {
                                                        opacity: 1,
                                                        backgroundColor: 'rgba(255,255,255,0.2)'
                                                    },
                                                    '&::after': {
                                                        content: '""',
                                                        width: '20px',
                                                        height: '2px',
                                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                                        borderRadius: '1px'
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </DraggableEvent>
                                );
                            })}

                            {/* Hour slots grid */}
                            {hours.map((hour) => {
                                // Check if there are events in this time slot
                                const hasEventsInSlot = eventsWithLayout.some(event => {
                                    if (event.allDay) return false;
                                    const eventStart = new Date(event.start);
                                    const eventEnd = new Date(event.end);
                                    const eventStartHour = eventStart.getHours();
                                    const eventEndHour = eventEnd.getHours();

                                    // Check if this hour slot is within the event's time range
                                    // Event spans this hour if it starts before or at this hour AND ends after this hour
                                    return eventStartHour <= hour && eventEndHour > hour;
                                });

                                return (
                                    <Box key={hour} sx={{
                                        display: 'flex',
                                        minHeight: '80px',
                                        borderBottom: hour < 23 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                    }}>
                                        {/* Hour Label */}
                                        <Box
                                            sx={{
                                                width: '100px',
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'center',
                                                background: 'linear-gradient(135deg, rgba(35,35,35,0.8) 0%, rgba(25,25,25,0.9) 100%)',
                                                borderRight: '1px solid rgba(74,144,226,0.1)'
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: 'rgba(255,255,255,0.7)',
                                                    transform: 'translateY(-8px)',
                                                    fontSize: '0.8rem',
                                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                                }}
                                            >
                                                {formatHour(hour)}
                                                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
                                                    (Click for {formatHour(hour)}-{formatHour(hour + 1)})
                                                </Typography>
                                            </Typography>
                                        </Box>
                                        {/* Events Column with smart hover system */}
                                        <DroppableTimeSlot
                                            date={date}
                                            hour={hour}
                                            onCreateEvent={onCreateEvent}
                                        >
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    p: 0.75,
                                                    minWidth: 0,
                                                    overflow: 'visible',
                                                    position: 'relative',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(74,144,226,0.02)',
                                                        '&::after': {
                                                            content: '"+"',
                                                            position: 'absolute',
                                                            top: '50%',
                                                            ...(hasEventsInSlot
                                                                ? {
                                                                    // Small icon in right gap when events exist
                                                                    right: '8px',
                                                                    transform: 'translateY(-50%)',
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    borderRadius: '50%',
                                                                    fontSize: '0.9rem'
                                                                }
                                                                : {
                                                                    // Center icon when no events
                                                                    left: '50%',
                                                                    transform: 'translate(-50%, -50%)',
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    borderRadius: '50%',
                                                                    fontSize: '1rem'
                                                                }
                                                            ),
                                                            color: '#ffffff',
                                                            fontWeight: 700,
                                                            backgroundColor: '#4A90E2',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: '2px solid rgba(255,255,255,0.9)',
                                                            boxShadow: hasEventsInSlot
                                                                ? '0 3px 12px rgba(74,144,226,0.5), 0 0 0 1px rgba(74,144,226,0.3)'
                                                                : '0 4px 16px rgba(74,144,226,0.6), 0 0 0 1px rgba(74,144,226,0.4)',
                                                            zIndex: 10,
                                                            transition: 'opacity 0.2s ease-out',
                                                            opacity: 1
                                                        }
                                                    }
                                                }}
                                                onClick={() => handleHourSlotClick(hour)}
                                            >
                                                {/* Empty space for events - events are now rendered as seamless blocks above */}
                                            </Box>
                                        </DroppableTimeSlot>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Paper>
                </Box>

                {/* Tasks Section */}
                {dayTasks.length > 0 && (
                    <Box sx={{ px: 2, pb: 2 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                background: 'linear-gradient(135deg, rgba(46,213,115,0.05) 0%, rgba(46,213,115,0.02) 100%)',
                                border: '1px solid rgba(46,213,115,0.2)',
                                borderRadius: 2,
                                backdropFilter: 'blur(8px)',
                                p: 2
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 1.5,
                                    fontWeight: 600,
                                    color: '#2ed573',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    fontSize: '0.8rem'
                                }}
                            >
                                Tasks ({dayTasks.length})
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {dayTasks.map(task => (
                                    <Box
                                        key={task.id}
                                        onClick={() => onTaskClick(task)}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            background: task.completed
                                                ? 'linear-gradient(135deg, rgba(46,213,115,0.15) 0%, rgba(46,213,115,0.08) 100%)'
                                                : 'linear-gradient(135deg, rgba(255,165,2,0.15) 0%, rgba(255,165,2,0.08) 100%)',
                                            border: `1px dashed ${task.completed ? 'rgba(46,213,115,0.4)' : 'rgba(255,165,2,0.4)'}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                background: task.completed
                                                    ? 'linear-gradient(135deg, rgba(46,213,115,0.25) 0%, rgba(46,213,115,0.15) 100%)'
                                                    : 'linear-gradient(135deg, rgba(255,165,2,0.25) 0%, rgba(255,165,2,0.15) 100%)',
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: 600,
                                                color: task.completed ? '#2ed573' : '#ffa502',
                                                mb: 0.5,
                                                textDecoration: task.completed ? 'line-through' : 'none',
                                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                            }}
                                        >
                                            {task.title}
                                        </Typography>

                                        {task.description && (
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                                                {task.description}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Box>
                )}
            </Box>
        </CalendarDragContext>
    );
};

export default DayView;
