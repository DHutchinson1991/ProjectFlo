"use client";

import React, { useState, useCallback } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
    Box,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import { CalendarEvent, CalendarTask } from '../types';
import { filterEventsByDate, filterTasksByDate } from '../utils';
import { useCalendarEvents } from '../hooks/useCalendar';
import {
    WeekHeaderRow,
    WeekTimeGrid,
    WeekEventsOverlay,
    WeekViewMoveContext,
    useWeekViewEventExtension,
    createWeekViewDragDropHandler
} from './WeekView/';

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

interface WeekViewProps {
    date: Date;
    events?: CalendarEvent[];
    loading?: boolean;
    error?: string | null;
    onEventClick: (event: CalendarEvent) => void;
    onEventDelete?: (event: CalendarEvent) => void;
    onCreateEvent?: (eventData: { start: Date; end: Date; title: string }) => void;
    onEventUpdate?: (eventId: string, updateData: { start: Date; end: Date }) => Promise<void>;
    onDateClick?: (date: Date) => void;
    tasks?: CalendarTask[];
    onTaskClick?: (task: CalendarTask) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
    date,
    events: propEvents,
    loading: propLoading,
    error: propError,
    onEventClick,
    onEventDelete,
    onCreateEvent,
    onEventUpdate,
    onDateClick = () => { },
    tasks = []
}) => {
    // Format hour display
    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    // Use either passed events or fetch our own if not provided
    const { events: hookEvents, loading: hookLoading, error: hookError } = useCalendarEvents(date, 'week');

    // Use props if provided, otherwise fallback to hook data
    const events = propEvents ?? hookEvents;
    const loading = propLoading ?? hookLoading;
    const error = propError ?? hookError;

    // Use the week view event extension hook for resizing events
    const {
        extensionState,
        handleExtensionStart,
        setHoveredEvent,
        justFinishedExtending
    } = useWeekViewEventExtension(events, {
        onEventUpdate,
        pixelsPerHour: 80,
        snapToMinutes: 15,
        minDurationMinutes: 15
    });

    // Drag and drop state for moving events to different times
    const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

    // Create drag and drop handler using the new modularized version
    const dragDropHandler = useCallback(createWeekViewDragDropHandler({
        onEventUpdate
    }), [onEventUpdate]);

    // Handle drag end for DnD
    const handleDnDEnd = useCallback(async (event: DragEndEvent) => {
        await dragDropHandler(event);
        setActiveEvent(null);
    }, [dragDropHandler]);

    // Handle drag start for DnD
    const handleDnDStart = useCallback((event: DragStartEvent) => {
        const dragData = event.active.data.current;
        if (dragData && dragData.event) {
            setActiveEvent(dragData.event);
        }
    }, []);

    // Calculate week start (Monday) and generate days
    const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        // Convert Sunday (0) to 7 for Monday-based week
        const mondayBasedDay = day === 0 ? 7 : day;
        const diff = d.getDate() - (mondayBasedDay - 1);
        return new Date(d.setDate(diff));
    };

    const weekStart = getWeekStart(date);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        return day;
    });

    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Get events for each day with positioning for seamless spanning and overlap handling
    const eventsWithPositionsByDay = weekDays.map(day => {
        const dayEvents = filterEventsByDate(events, day);

        // Define extended event type with positioning info
        type ExtendedEvent = typeof dayEvents[0] & {
            top: number;
            height: number;
            isAllDay: boolean;
            startMinutes?: number;
            endMinutes?: number;
            widthPercent?: number;
            leftOffsetPercent?: number;
            isSpanningEvent?: boolean; // Mark if this is part of a multi-day event
            spanStartDay?: boolean; // First day of span
            spanEndDay?: boolean; // Last day of span
        };

        // Calculate basic positioning first, with multi-day support
        const eventsWithBasicPositioning: ExtendedEvent[] = dayEvents.map(event => {
            if (event.allDay) {
                return {
                    ...event,
                    top: 0,
                    height: 60,
                    isAllDay: true
                };
            }

            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            // Check if this event spans multiple days
            const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
            const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
            const currentDayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());

            const isSpanningEvent = eventStartDate.getTime() !== eventEndDate.getTime();
            const spanStartDay = currentDayDate.getTime() === eventStartDate.getTime();
            const spanEndDay = currentDayDate.getTime() === eventEndDate.getTime();

            // Calculate the start and end times for this specific day
            let dayStartMinutes, dayEndMinutes;

            if (isSpanningEvent) {
                if (spanStartDay) {
                    // First day: start at event start time, end at midnight
                    dayStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                    dayEndMinutes = 24 * 60; // End of day
                } else if (spanEndDay) {
                    // Last day: start at midnight, end at event end time
                    dayStartMinutes = 0; // Start of day
                    dayEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
                } else {
                    // Middle day: full day
                    dayStartMinutes = 0;
                    dayEndMinutes = 24 * 60;
                }
            } else {
                // Single day event
                dayStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                dayEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
            }

            const durationMinutes = dayEndMinutes - dayStartMinutes;

            // 80px per hour to match the minHeight of hour slots
            const pixelsPerMinute = 80 / 60; // 80px per hour / 60 minutes

            // Account for 1px border-bottom on each hour row (except the last)
            // Each complete hour before this event adds 1px to the offset
            const borderOffset = Math.floor(dayStartMinutes / 60); // 1px per completed hour

            // For height, also account for borders within the event's span
            // Count borders that fall within the event duration
            const startHour = Math.floor(dayStartMinutes / 60);
            const endHour = Math.floor(dayEndMinutes / 60);
            const bordersWithinEvent = Math.max(0, endHour - startHour); // Borders between start and end hour

            return {
                ...event,
                top: dayStartMinutes * pixelsPerMinute + borderOffset,
                height: Math.max(durationMinutes * pixelsPerMinute + bordersWithinEvent, 15), // Minimum 15px height
                isAllDay: false,
                startMinutes: dayStartMinutes,
                endMinutes: dayEndMinutes,
                isSpanningEvent,
                spanStartDay,
                spanEndDay
            };
        });

        // Now handle overlaps - only for non-allDay events
        const nonAllDayEvents = eventsWithBasicPositioning.filter(event => !event.allDay);
        const allDayEvents = eventsWithBasicPositioning.filter(event => event.allDay);

        // Group overlapping events
        const eventGroups: ExtendedEvent[][] = [];

        for (const event of nonAllDayEvents) {
            let addedToGroup = false;

            // Try to find an existing group this event overlaps with
            for (const group of eventGroups) {
                const overlapsWithGroup = group.some(groupEvent =>
                    event.startMinutes! < groupEvent.endMinutes! &&
                    event.endMinutes! > groupEvent.startMinutes!
                );

                if (overlapsWithGroup) {
                    group.push(event);
                    addedToGroup = true;
                    break;
                }
            }

            // If no overlapping group found, create a new group
            if (!addedToGroup) {
                eventGroups.push([event]);
            }
        }

        // Calculate positions for each group
        const finalEvents: ExtendedEvent[] = [];

        for (const group of eventGroups) {
            if (group.length === 1) {
                // Single event - full width
                finalEvents.push({
                    ...group[0],
                    widthPercent: 100,
                    leftOffsetPercent: 0
                });
            } else {
                // Multiple overlapping events - split width
                const widthPercent = 100 / group.length;
                group.forEach((event, index) => {
                    finalEvents.push({
                        ...event,
                        widthPercent,
                        leftOffsetPercent: index * widthPercent
                    });
                });
            }
        }

        // Add back all-day events
        allDayEvents.forEach(event => {
            finalEvents.push({
                ...event,
                widthPercent: 100,
                leftOffsetPercent: 0
            });
        });

        return {
            day,
            events: finalEvents
        };
    });

    // Handle click on empty hour slot to create event
    const handleHourSlotClick = (day: Date, hour: number) => {
        if (!onCreateEvent) return;

        const startTime = new Date(day);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);

        const defaultTitle = `New Event ${formatHour(hour)}`;

        console.log('🆕 WeekView: Creating new event for hour:', hour);
        console.log('🆕 WeekView: Time range:', {
            day: day.toDateString(),
            clickedHour: hour,
            formatHour: formatHour(hour),
            start: startTime.toString(),
            end: endTime.toString(),
            title: defaultTitle
        });

        onCreateEvent({
            start: startTime,
            end: endTime,
            title: defaultTitle
        });
    };

    // Get tasks for a specific day
    const getDayTasks = (day: Date) => {
        return filterTasksByDate(tasks, day).slice(0, 3); // Show max 3 tasks
    };

    // Loading state with skeleton UI
    if (loading) {
        return (
            <Box
                sx={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Skeleton Header */}
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {[...Array(7)].map((_, i) => (
                            <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        height: 16,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 1,
                                        mb: 1,
                                        animation: 'skeletonPulse 2s ease-in-out infinite',
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                />
                                <Box
                                    sx={{
                                        height: 20,
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        borderRadius: 1,
                                        animation: 'skeletonPulse 2s ease-in-out infinite',
                                        animationDelay: `${i * 0.1 + 0.2}s`
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Skeleton Time Grid */}
                <Box sx={{ p: 2, flex: 1 }}>
                    <Box sx={{ display: 'flex' }}>
                        {/* Time labels */}
                        <Box sx={{ width: 100, pr: 2 }}>
                            {[...Array(12)].map((_, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        height: 80,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 12,
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            borderRadius: 1,
                                            animation: 'skeletonPulse 2s ease-in-out infinite',
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    />
                                </Box>
                            ))}
                        </Box>

                        {/* Day columns with skeleton events */}
                        <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                            {[...Array(7)].map((_, dayIndex) => (
                                <Box key={dayIndex} sx={{ flex: 1, position: 'relative' }}>
                                    {/* Random skeleton events */}
                                    {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, eventIndex) => {
                                        const randomTop = Math.random() * 600;
                                        const randomHeight = Math.random() * 120 + 40;
                                        return (
                                            <Box
                                                key={eventIndex}
                                                sx={{
                                                    position: 'absolute',
                                                    top: randomTop,
                                                    left: 4,
                                                    right: 4,
                                                    height: randomHeight,
                                                    backgroundColor: 'rgba(74,144,226,0.1)',
                                                    borderLeft: '3px solid rgba(74,144,226,0.3)',
                                                    borderRadius: 1,
                                                    animation: 'skeletonPulse 2s ease-in-out infinite',
                                                    animationDelay: `${(dayIndex * 3 + eventIndex) * 0.1}s`
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Loading indicator overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: 'rgba(10,10,10,0.9)',
                        padding: 2,
                        borderRadius: 2,
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(74,144,226,0.2)'
                    }}
                >
                    <CircularProgress
                        size={20}
                        sx={{
                            color: '#4A90E2',
                            '& .MuiCircularProgress-circle': {
                                strokeLinecap: 'round',
                            }
                        }}
                    />
                    <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.875rem' }}>
                        Loading events...
                    </Typography>
                </Box>
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
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <WeekViewMoveContext
            onDragStart={handleDnDStart}
            onDragEnd={handleDnDEnd}
            activeEvent={activeEvent}
        >
            <Box
                data-calendar-container
                sx={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
                    position: 'relative',
                    animation: 'fadeIn 0.3s ease-out',
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
                {/* Days Header - Compact */}
                <WeekHeaderRow
                    weekDays={weekDays}
                    dayNames={dayNames}
                    events={events}
                    tasks={tasks}
                    onDateClick={onDateClick}
                    getDayTasks={getDayTasks}
                />

                {/* Week Grid */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        px: 2,
                        pb: 2,
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    <WeekTimeGrid
                        hours={hours}
                        weekDays={weekDays}
                        eventsWithPositionsByDay={eventsWithPositionsByDay}
                        formatHour={formatHour}
                        handleHourSlotClick={handleHourSlotClick}
                        onCreateEvent={onCreateEvent}
                    />

                    {/* Events overlay - positioned absolutely over the time grid */}
                    <WeekEventsOverlay
                        eventsWithPositionsByDay={eventsWithPositionsByDay}
                        dragState={extensionState}
                        justFinishedDragging={justFinishedExtending}
                        onEventClick={onEventClick}
                        onEventDelete={onEventDelete}
                        handleDragStart={handleExtensionStart}
                        setHoveredEvent={setHoveredEvent}
                    />
                </Box>
            </Box>
        </WeekViewMoveContext>
    );
};

export default WeekView;
