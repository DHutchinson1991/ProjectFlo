"use client";

import React from 'react';
import {
    Box, Typography, Paper, Chip, Accordion, AccordionSummary, AccordionDetails,
    List, CircularProgress, Alert, IconButton, alpha, useTheme,
} from '@mui/material';
import { ExpandMore, Refresh as RefreshIcon } from '@mui/icons-material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import {
    getEventsInDateRange, getTasksInDateRange, getUpcomingDeadlines, getOverdueTasks,
} from '@/features/workflow/calendar/utils/calendar-event-helpers';
import { formatDate, isToday, addDays } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { useCalendarEvents } from '@/features/workflow/calendar/hooks/use-calendar';
import AgendaOverviewCards from './AgendaOverviewCards';
import AgendaEventItem from './AgendaEventItem';
import AgendaTaskItem from './AgendaTaskItem';

interface AgendaViewProps {
    date: Date;
    tasks?: CalendarTask[];
    onEventClick: (event: CalendarEvent) => void;
    onTaskClick?: (task: CalendarTask) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
    date, tasks = [], onEventClick, onTaskClick = () => {},
}) => {
    const theme = useTheme();
    const endDate = addDays(date, 30);
    const { events, loading, error, refreshEvents } = useCalendarEvents(date, 'month');

    const upcomingEvents = getEventsInDateRange(events, date, endDate);
    const upcomingTasks = getTasksInDateRange(tasks, date, endDate);
    const upcomingDeadlines = getUpcomingDeadlines(events, tasks, 7);
    const overdueTasks = getOverdueTasks(tasks);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>Loading agenda...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error"
                action={<IconButton color="inherit" size="small" onClick={refreshEvents}><RefreshIcon /></IconButton>}>
                {error}
            </Alert>
        );
    }

    const groupItemsByDate = () => {
        const grouped: { [key: string]: { events: CalendarEvent[]; tasks: CalendarTask[] } } = {};
        upcomingEvents.forEach(event => {
            const dateKey = formatDate(event.start);
            if (!grouped[dateKey]) grouped[dateKey] = { events: [], tasks: [] };
            grouped[dateKey].events.push(event);
        });
        upcomingTasks.forEach(task => {
            const dateKey = formatDate(task.dueDate);
            if (!grouped[dateKey]) grouped[dateKey] = { events: [], tasks: [] };
            grouped[dateKey].tasks.push(task);
        });
        return Object.entries(grouped).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    };

    const groupedItems = groupItemsByDate();

    return (
        <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
            <AgendaOverviewCards
                upcomingEvents={upcomingEvents} upcomingTasks={upcomingTasks}
                upcomingDeadlines={upcomingDeadlines} overdueTasks={overdueTasks} />

            <Typography variant="h5" fontWeight={600} gutterBottom>Detailed Agenda</Typography>

            {groupedItems.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No events or tasks scheduled for the next 30 days
                    </Typography>
                </Paper>
            ) : (
                groupedItems.map(([dateStr, { events: dayEvents, tasks: dayTasks }]) => {
                    const dayDate = new Date(dateStr);
                    const isTodayDate = isToday(dayDate);
                    return (
                        <Accordion key={dateStr} defaultExpanded={isTodayDate}
                            sx={{ mb: 1, backgroundColor: isTodayDate ? alpha(theme.palette.primary.main, 0.05) : 'background.paper' }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        {dateStr}
                                        {isTodayDate && <Chip label="Today" size="small" color="primary" sx={{ ml: 1, height: 20 }} />}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                                        {dayEvents.length > 0 && <Chip label={`${dayEvents.length} events`} size="small" variant="outlined" color="primary" />}
                                        {dayTasks.length > 0 && <Chip label={`${dayTasks.length} tasks`} size="small" variant="outlined" color="secondary" />}
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    <Box>
                                        {dayEvents.length > 0 && (
                                            <>
                                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Events</Typography>
                                                <List dense>{dayEvents.map(e => <AgendaEventItem key={e.id} event={e} onEventClick={onEventClick} />)}</List>
                                            </>
                                        )}
                                    </Box>
                                    <Box>
                                        {dayTasks.length > 0 && (
                                            <>
                                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tasks</Typography>
                                                <List dense>{dayTasks.map(t => <AgendaTaskItem key={t.id} task={t} onTaskClick={onTaskClick} />)}</List>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            )}
        </Box>
    );
};

export default AgendaView;
