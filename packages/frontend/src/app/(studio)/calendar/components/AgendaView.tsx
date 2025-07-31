"use client";

import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    useTheme,
    alpha,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import {
    ExpandMore,
    Event as EventIcon,
    Task as TaskIcon,
    Schedule,
    LocationOn,
    Person,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { CalendarEvent, CalendarTask } from '../types';
import {
    getEventsInDateRange,
    getTasksInDateRange,
    formatDate,
    formatTime,
    isToday,
    addDays,
    getUpcomingDeadlines,
    getOverdueTasks
} from '../utils';
import { eventTypeConfig, taskTypeConfig, priorityConfig } from '../config';
import { useCalendarEvents } from '../hooks/useCalendar';

interface AgendaViewProps {
    date: Date;
    tasks?: CalendarTask[];
    onEventClick: (event: CalendarEvent) => void;
    onTaskClick?: (task: CalendarTask) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
    date,
    tasks = [],
    onEventClick,
    onTaskClick = () => { }
}) => {
    const theme = useTheme();
    const endDate = addDays(date, 30); // Show next 30 days

    // Use real calendar data for a 30-day range
    const { events, loading, error, refreshEvents } = useCalendarEvents(date, 'month');

    // Filter events and tasks for the date range
    const upcomingEvents = getEventsInDateRange(events, date, endDate);
    const upcomingTasks = getTasksInDateRange(tasks, date, endDate);
    const upcomingDeadlines = getUpcomingDeadlines(events, tasks, 7);
    const overdueTasks = getOverdueTasks(tasks);

    // Loading state
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading agenda...
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert
                severity="error"
                action={
                    <IconButton color="inherit" size="small" onClick={refreshEvents}>
                        <RefreshIcon />
                    </IconButton>
                }
            >
                {error}
            </Alert>
        );
    }

    // Group events and tasks by date
    const groupItemsByDate = () => {
        const grouped: { [key: string]: { events: CalendarEvent[]; tasks: CalendarTask[] } } = {};

        // Group events
        upcomingEvents.forEach(event => {
            const dateKey = formatDate(event.start);
            if (!grouped[dateKey]) {
                grouped[dateKey] = { events: [], tasks: [] };
            }
            grouped[dateKey].events.push(event);
        });

        // Group tasks
        upcomingTasks.forEach(task => {
            const dateKey = formatDate(task.dueDate);
            if (!grouped[dateKey]) {
                grouped[dateKey] = { events: [], tasks: [] };
            }
            grouped[dateKey].tasks.push(task);
        });

        // Sort by date
        return Object.entries(grouped)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    };

    const renderEvent = (event: CalendarEvent) => {
        const config = eventTypeConfig[event.type];
        const priorityConf = priorityConfig[event.priority];

        return (
            <ListItem
                key={event.id}
                onClick={() => onEventClick(event)}
                sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: alpha(config.color, 0.05),
                    border: `1px solid ${alpha(config.color, 0.2)}`,
                    '&:hover': {
                        backgroundColor: alpha(config.color, 0.1),
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                <ListItemIcon>
                    <EventIcon sx={{ color: config.color }} />
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {event.title}
                            </Typography>
                            <Chip
                                label={priorityConf.label}
                                size="small"
                                sx={{
                                    backgroundColor: priorityConf.color,
                                    color: 'white',
                                    height: 18,
                                    fontSize: '0.6rem'
                                }}
                            />
                            <Chip
                                label={config.label}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: config.color,
                                    color: config.color,
                                    height: 18,
                                    fontSize: '0.6rem'
                                }}
                            />
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

    const renderTask = (task: CalendarTask) => {
        const config = taskTypeConfig[task.type];
        const priorityConf = priorityConfig[task.priority];

        return (
            <ListItem
                key={task.id}
                onClick={() => onTaskClick(task)}
                sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: alpha(config.color, 0.05),
                    border: `1px solid ${alpha(config.color, 0.2)}`,
                    borderLeft: `4px solid ${priorityConf.color}`,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.7 : 1,
                    '&:hover': {
                        backgroundColor: alpha(config.color, 0.1),
                        transform: 'translateY(-2px)'
                    }
                }}
            >
                <ListItemIcon>
                    <TaskIcon sx={{ color: config.color }} />
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {task.title}
                            </Typography>
                            <Chip
                                label={priorityConf.label}
                                size="small"
                                sx={{
                                    backgroundColor: priorityConf.color,
                                    color: 'white',
                                    height: 18,
                                    fontSize: '0.6rem'
                                }}
                            />
                            <Chip
                                label={config.label}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: config.color,
                                    color: config.color,
                                    height: 18,
                                    fontSize: '0.6rem'
                                }}
                            />
                            {task.completed && (
                                <Chip
                                    label="Completed"
                                    size="small"
                                    sx={{
                                        backgroundColor: theme.palette.success.main,
                                        color: 'white',
                                        height: 18,
                                        fontSize: '0.6rem'
                                    }}
                                />
                            )}
                        </Box>
                    }
                    secondary={
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Schedule sx={{ fontSize: 14 }} />
                                    <Typography variant="caption">
                                        Due: {formatTime(task.dueDate)}
                                    </Typography>
                                </Box>

                                {task.estimatedHours && (
                                    <Typography variant="caption" color="text.secondary">
                                        ⏱️ {task.estimatedHours}h estimated
                                    </Typography>
                                )}

                                {task.assignee && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Person sx={{ fontSize: 14 }} />
                                        <Typography variant="caption">{task.assignee.name}</Typography>
                                    </Box>
                                )}
                            </Box>

                            {task.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {task.description}
                                </Typography>
                            )}
                        </Box>
                    }
                />
            </ListItem>
        );
    };

    const groupedItems = groupItemsByDate();

    return (
        <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
            {/* Overview cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
                {/* Upcoming deadlines */}
                {upcomingDeadlines.length > 0 && (
                    <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            🚨 Upcoming Deadlines (7 days)
                        </Typography>
                        <List dense>
                            {upcomingDeadlines.slice(0, 3).map((item) => (
                                <ListItem key={`deadline-${item.id}`} sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={item.title}
                                        secondary={formatDate('start' in item ? item.start : item.dueDate)}
                                    />
                                </ListItem>
                            ))}
                        </List>
                        {upcomingDeadlines.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                                +{upcomingDeadlines.length - 3} more
                            </Typography>
                        )}
                    </Paper>
                )}

                {/* Overdue tasks */}
                {overdueTasks.length > 0 && (
                    <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.error.main, 0.1) }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            ⚠️ Overdue Tasks
                        </Typography>
                        <List dense>
                            {overdueTasks.slice(0, 3).map((task) => (
                                <ListItem key={`overdue-${task.id}`} sx={{ py: 0.5 }}>
                                    <ListItemText
                                        primary={task.title}
                                        secondary={`Due: ${formatDate(task.dueDate)}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                        {overdueTasks.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                                +{overdueTasks.length - 3} more
                            </Typography>
                        )}
                    </Paper>
                )}

                {/* Quick stats */}
                <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        📊 Next 30 Days
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Total Events:</Typography>
                            <Typography variant="body2" fontWeight={600}>{upcomingEvents.length}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Total Tasks:</Typography>
                            <Typography variant="body2" fontWeight={600}>{upcomingTasks.length}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Completed Tasks:</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {upcomingTasks.filter(t => t.completed).length}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Daily agenda */}
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Detailed Agenda
            </Typography>

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
                        <Accordion
                            key={dateStr}
                            defaultExpanded={isTodayDate}
                            sx={{
                                mb: 1,
                                backgroundColor: isTodayDate ? alpha(theme.palette.primary.main, 0.05) : 'background.paper'
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        {dateStr}
                                        {isTodayDate && (
                                            <Chip
                                                label="Today"
                                                size="small"
                                                color="primary"
                                                sx={{ ml: 1, height: 20 }}
                                            />
                                        )}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                                        {dayEvents.length > 0 && (
                                            <Chip
                                                label={`${dayEvents.length} events`}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                        )}
                                        {dayTasks.length > 0 && (
                                            <Chip
                                                label={`${dayTasks.length} tasks`}
                                                size="small"
                                                variant="outlined"
                                                color="secondary"
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    {/* Events */}
                                    <Box>
                                        {dayEvents.length > 0 && (
                                            <>
                                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                    Events
                                                </Typography>
                                                <List dense>
                                                    {dayEvents.map(renderEvent)}
                                                </List>
                                            </>
                                        )}
                                    </Box>

                                    {/* Tasks */}
                                    <Box>
                                        {dayTasks.length > 0 && (
                                            <>
                                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                    Tasks
                                                </Typography>
                                                <List dense>
                                                    {dayTasks.map(renderTask)}
                                                </List>
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
