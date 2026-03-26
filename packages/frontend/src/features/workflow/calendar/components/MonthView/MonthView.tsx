"use client";

import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, IconButton } from '@mui/material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { getCalendarDays } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { filterEventsByDate, filterTasksByDate } from '@/features/workflow/calendar/utils/calendar-event-helpers';
import { useCalendarEvents } from '@/features/workflow/calendar/hooks/use-calendar';
import WeekDayHeaders from './WeekDayHeaders';
import MonthDayCell from './MonthDayCell';
import MonthHoverTooltip from './MonthHoverTooltip';

interface MonthViewProps {
    date: Date;
    onDateClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    tasks?: CalendarTask[];
    onTaskClick?: (task: CalendarTask) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
    date, onDateClick, onEventClick, tasks = [], onTaskClick = () => {},
}) => {
    const calendarDays = getCalendarDays(date, 1);
    const { events, loading, error, refreshEvents } = useCalendarEvents(date, 'month');

    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const [hoveredDayRef, setHoveredDayRef] = useState<HTMLElement | null>(null);

    const isCurrentMonth = (day: Date) => day.getMonth() === date.getMonth();

    const getDayEvents = (day: Date) => filterEventsByDate(events, day).slice(0, 3);
    const getDayTasks = (day: Date) => filterTasksByDate(tasks, day).slice(0, 2);
    const getMoreCount = (day: Date) => {
        const total = filterEventsByDate(events, day).length + filterTasksByDate(tasks, day).length;
        const shown = Math.min(filterEventsByDate(events, day).length, 3) + Math.min(filterTasksByDate(tasks, day).length, 2);
        return total > shown ? total - shown : 0;
    };

    const handleMouseEnter = (day: Date, e: React.MouseEvent<HTMLElement>) => {
        setHoveredDay(day);
        setHoveredDayRef(e.currentTarget);
    };
    const handleMouseLeave = () => { setHoveredDay(null); setHoveredDayRef(null); };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%"
                sx={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', borderRadius: 2 }}>
                <CircularProgress sx={{ color: '#64ffda', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                <Typography variant="body2" sx={{ ml: 2, color: '#e0e0e0' }}>Loading calendar events...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                <Alert severity="error"
                    sx={{ backgroundColor: '#2d1b1b', color: '#ffcdd2', '& .MuiAlert-icon': { color: '#ff5252' } }}
                    action={<IconButton color="inherit" size="small" onClick={refreshEvents} sx={{ color: '#ff5252' }}>
                        <Typography variant="caption">Retry</Typography>
                    </IconButton>}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{
            height: '100%', width: '100%',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
            borderRadius: 4, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,144,226,0.08)',
            position: 'relative',
            '&::before': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(ellipse at top, rgba(74,144,226,0.03) 0%, transparent 50%)',
                pointerEvents: 'none',
            },
        }}>
            <WeekDayHeaders />

            <Box sx={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)',
                gap: 1.5, flex: 1, minHeight: 0, position: 'relative', zIndex: 1, px: 2, pb: 2,
            }}>
                {calendarDays.map(day => (
                    <MonthDayCell
                        key={day.toISOString()}
                        day={day}
                        isCurrentMonth={isCurrentMonth(day)}
                        dayEvents={getDayEvents(day)}
                        dayTasks={getDayTasks(day)}
                        moreCount={getMoreCount(day)}
                        onDateClick={onDateClick}
                        onEventClick={onEventClick}
                        onTaskClick={onTaskClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                ))}
            </Box>

            <MonthHoverTooltip hoveredDay={hoveredDay} anchorEl={hoveredDayRef} events={events} tasks={tasks} />
        </Box>
    );
};

export default MonthView;
