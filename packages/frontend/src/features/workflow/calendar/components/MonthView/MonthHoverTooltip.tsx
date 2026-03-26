import React from 'react';
import { Box, Typography, Popper, Paper } from '@mui/material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { formatTime } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { filterEventsByDate, filterTasksByDate } from '@/features/workflow/calendar/utils/calendar-event-helpers';
import { getEventColor } from '@/features/workflow/calendar/constants/calendar-config';

interface MonthHoverTooltipProps {
    hoveredDay: Date | null;
    anchorEl: HTMLElement | null;
    events: CalendarEvent[];
    tasks: CalendarTask[];
}

const MonthHoverTooltip: React.FC<MonthHoverTooltipProps> = ({ hoveredDay, anchorEl, events, tasks }) => (
    <Popper
        open={Boolean(hoveredDay && anchorEl)}
        anchorEl={anchorEl}
        placement="top"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: 9999 }}
    >
        <Paper sx={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            p: 2, borderRadius: 2, border: '1px solid rgba(74,144,226,0.3)',
            maxWidth: 300, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative',
            '&::before': {
                content: '""', position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(74,144,226,0.3)',
            },
        }}>
            {hoveredDay && (() => {
                const dayEvents = filterEventsByDate(events, hoveredDay);
                const dayTasks = filterTasksByDate(tasks, hoveredDay);
                return (
                    <>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#4A90E2', fontWeight: 700 }}>
                            {hoveredDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>

                        {dayEvents.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#e0e0e0' }}>
                                    📅 Events ({dayEvents.length})
                                </Typography>
                                {dayEvents.slice(0, 4).map(event => (
                                    <Box key={event.id} sx={{ display: 'flex', alignItems: 'center', pl: 1, mb: 0.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: 1, background: getEventColor(event.type), mr: 1, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ color: '#b0b0b0', fontSize: '0.7rem' }}>
                                            {event.title} {event.allDay ? '' : `at ${formatTime(event.start)}`}
                                        </Typography>
                                    </Box>
                                ))}
                                {dayEvents.length > 4 && (
                                    <Typography variant="caption" sx={{ display: 'block', pl: 2.5, fontStyle: 'italic', color: '#888', fontSize: '0.65rem' }}>
                                        ... and {dayEvents.length - 4} more events
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {dayTasks.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#e0e0e0' }}>
                                    ☑️ Tasks ({dayTasks.length})
                                </Typography>
                                {dayTasks.slice(0, 4).map(task => (
                                    <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', pl: 1, mb: 0.5 }}>
                                        <Box sx={{
                                            width: 10, height: 10, borderRadius: 1.5,
                                            border: task.completed ? 'none'
                                                : task.priority === 'high' ? '1.5px solid #ff5252'
                                                : task.priority === 'medium' ? '1.5px solid #ffb74d' : '1.5px solid #ab47bc',
                                            background: task.completed ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' : 'transparent',
                                            mr: 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '6px', color: '#ffffff', fontWeight: 'bold',
                                        }}>
                                            {task.completed ? '✓' : ''}
                                        </Box>
                                        <Typography variant="caption" sx={{
                                            color: task.completed ? 'rgba(176, 176, 176, 0.7)' : '#b0b0b0',
                                            fontSize: '0.7rem', textDecoration: task.completed ? 'line-through' : 'none',
                                        }}>
                                            {task.title}
                                            {task.priority === 'high' && !task.completed && (
                                                <Box component="span" sx={{ color: '#ff5252', ml: 0.5, fontSize: '0.6rem' }}>
                                                    (High Priority)
                                                </Box>
                                            )}
                                        </Typography>
                                    </Box>
                                ))}
                                {dayTasks.length > 4 && (
                                    <Typography variant="caption" sx={{ display: 'block', pl: 2.5, fontStyle: 'italic', color: '#888', fontSize: '0.65rem' }}>
                                        ... and {dayTasks.length - 4} more tasks
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {dayEvents.length === 0 && dayTasks.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#888', fontSize: '0.7rem' }}>
                                    📅 No events or tasks scheduled
                                </Typography>
                            </Box>
                        )}
                    </>
                );
            })()}
        </Paper>
    </Popper>
);

export default MonthHoverTooltip;
