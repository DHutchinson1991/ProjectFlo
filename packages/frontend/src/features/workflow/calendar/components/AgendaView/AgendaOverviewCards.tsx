"use client";

import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, alpha, useTheme } from '@mui/material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { formatDate } from '@/features/workflow/calendar/utils/calendar-date-helpers';

interface AgendaOverviewCardsProps {
    upcomingEvents: CalendarEvent[];
    upcomingTasks: CalendarTask[];
    upcomingDeadlines: (CalendarEvent | CalendarTask)[];
    overdueTasks: CalendarTask[];
}

const AgendaOverviewCards: React.FC<AgendaOverviewCardsProps> = ({
    upcomingEvents, upcomingTasks, upcomingDeadlines, overdueTasks,
}) => {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
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
    );
};

export default AgendaOverviewCards;
