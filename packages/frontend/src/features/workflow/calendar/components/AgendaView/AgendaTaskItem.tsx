"use client";

import React from 'react';
import { Box, Typography, Chip, ListItem, ListItemText, ListItemIcon, alpha, useTheme } from '@mui/material';
import { Task as TaskIcon, Schedule, Person } from '@mui/icons-material';
import { CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { formatTime } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { taskTypeConfig, priorityConfig } from '@/features/workflow/calendar/constants/calendar-config';

interface AgendaTaskItemProps {
    task: CalendarTask;
    onTaskClick: (task: CalendarTask) => void;
}

const AgendaTaskItem: React.FC<AgendaTaskItemProps> = ({ task, onTaskClick }) => {
    const theme = useTheme();
    const config = taskTypeConfig[task.type];
    const priorityConf = priorityConfig[task.priority];

    return (
        <ListItem
            onClick={() => onTaskClick(task)}
            sx={{
                cursor: 'pointer', borderRadius: 1, mb: 1,
                backgroundColor: alpha(config.color, 0.05),
                border: `1px solid ${alpha(config.color, 0.2)}`,
                borderLeft: `4px solid ${priorityConf.color}`,
                textDecoration: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.7 : 1,
                '&:hover': { backgroundColor: alpha(config.color, 0.1), transform: 'translateY(-2px)' },
            }}
        >
            <ListItemIcon>
                <TaskIcon sx={{ color: config.color }} />
            </ListItemIcon>
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>{task.title}</Typography>
                        <Chip label={priorityConf.label} size="small"
                            sx={{ backgroundColor: priorityConf.color, color: 'white', height: 18, fontSize: '0.6rem' }} />
                        <Chip label={config.label} size="small" variant="outlined"
                            sx={{ borderColor: config.color, color: config.color, height: 18, fontSize: '0.6rem' }} />
                        {task.completed && (
                            <Chip label="Completed" size="small"
                                sx={{ backgroundColor: theme.palette.success.main, color: 'white', height: 18, fontSize: '0.6rem' }} />
                        )}
                    </Box>
                }
                secondary={
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule sx={{ fontSize: 14 }} />
                                <Typography variant="caption">Due: {formatTime(task.dueDate)}</Typography>
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

export default AgendaTaskItem;
