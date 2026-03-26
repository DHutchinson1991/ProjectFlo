"use client";

import React, { useState, useCallback } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Box, Alert } from '@mui/material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { filterTasksByDate } from '@/features/workflow/calendar/utils/calendar-event-helpers';
import { useCalendarEvents } from '@/features/workflow/calendar/hooks/use-calendar';
import { injectCalendarAnimations } from '@/features/workflow/calendar/constants/calendar-animations';
import {
    WeekHeaderRow, WeekTimeGrid, WeekEventsOverlay, WeekViewMoveContext,
    useWeekViewEventExtension, createWeekViewDragDropHandler,
} from './';
import WeekViewSkeleton from './WeekViewSkeleton';
import { calculateWeekEventPositions } from '../../utils/week-view-positioning';

injectCalendarAnimations();

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

const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
};

const getWeekStart = (d: Date) => {
    const copy = new Date(d);
    const day = copy.getDay();
    const mondayBased = day === 0 ? 7 : day;
    copy.setDate(copy.getDate() - (mondayBased - 1));
    return copy;
};

const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const hours = Array.from({ length: 24 }, (_, i) => i);

const WeekView: React.FC<WeekViewProps> = ({
    date, events: propEvents, loading: propLoading, error: propError,
    onEventClick, onEventDelete, onCreateEvent, onEventUpdate,
    onDateClick = () => {}, tasks = [], onTaskClick = () => {},
}) => {
    const { events: hookEvents, loading: hookLoading, error: hookError } = useCalendarEvents(date, 'week');
    const events = propEvents ?? hookEvents;
    const loading = propLoading ?? hookLoading;
    const error = propError ?? hookError;

    const { extensionState, handleExtensionStart, setHoveredEvent, justFinishedExtending } =
        useWeekViewEventExtension(events, { onEventUpdate, pixelsPerHour: 80, snapToMinutes: 15, minDurationMinutes: 15 });

    const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

    const dragDropHandler = useCallback(createWeekViewDragDropHandler({ onEventUpdate }), [onEventUpdate]);

    const handleDnDEnd = useCallback(async (event: DragEndEvent) => {
        await dragDropHandler(event);
        setActiveEvent(null);
    }, [dragDropHandler]);

    const handleDnDStart = useCallback((event: DragStartEvent) => {
        const dragData = event.active.data.current;
        if (dragData?.event) setActiveEvent(dragData.event);
    }, []);

    const weekStart = getWeekStart(date);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        return day;
    });

    const eventsWithPositionsByDay = calculateWeekEventPositions(weekDays, events);

    const handleHourSlotClick = (day: Date, hour: number) => {
        if (!onCreateEvent) return;
        const start = new Date(day);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(hour + 1, 0, 0, 0);
        onCreateEvent({ start, end, title: `New Event ${formatHour(hour)}` });
    };

    const getDayTasks = (day: Date) => filterTasksByDate(tasks, day).slice(0, 3);

    if (loading) return <WeekViewSkeleton />;

    if (error) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                <Alert severity="error" sx={{ backgroundColor: '#2d1b1b', color: '#ffcdd2', '& .MuiAlert-icon': { color: '#ff5252' } }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <WeekViewMoveContext onDragStart={handleDnDStart} onDragEnd={handleDnDEnd} activeEvent={activeEvent}>
            <Box data-calendar-container sx={{
                width: '100%',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                borderRadius: 4, display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
                position: 'relative', animation: 'calSlideIn 0.3s ease-out',
                '&::before': {
                    content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(ellipse at top, rgba(74,144,226,0.03) 0%, transparent 50%)',
                    pointerEvents: 'none',
                },
            }}>
                <WeekHeaderRow weekDays={weekDays} dayNames={dayNames} events={events}
                    tasks={tasks} onDateClick={onDateClick} getDayTasks={getDayTasks} onTaskClick={onTaskClick} />

                <Box sx={{ display: 'flex', flexDirection: 'column', px: 2, pb: 2, position: 'relative', zIndex: 1 }}>
                    <WeekTimeGrid hours={hours} weekDays={weekDays}
                        eventsWithPositionsByDay={eventsWithPositionsByDay}
                        formatHour={formatHour} handleHourSlotClick={handleHourSlotClick}
                        onCreateEvent={onCreateEvent} />

                    <WeekEventsOverlay eventsWithPositionsByDay={eventsWithPositionsByDay}
                        dragState={extensionState} justFinishedDragging={justFinishedExtending}
                        onEventClick={onEventClick} onEventDelete={onEventDelete}
                        handleDragStart={handleExtensionStart} setHoveredEvent={setHoveredEvent} />
                </Box>
            </Box>
        </WeekViewMoveContext>
    );
};

export default WeekView;
