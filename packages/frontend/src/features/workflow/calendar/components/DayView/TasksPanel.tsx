import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarTask } from '@/features/workflow/calendar/types/calendar-types';

interface TasksPanelProps {
    tasks: CalendarTask[];
    onTaskClick: (task: CalendarTask) => void;
}

const TasksPanel: React.FC<TasksPanelProps> = ({ tasks, onTaskClick }) => {
    if (tasks.length === 0) return null;

    return (
        <Box sx={{ flex: '0 0 35%', minWidth: 240, maxWidth: 400, overflow: 'auto' }}>
            <Box
                sx={{
                    background: 'linear-gradient(135deg, rgba(46,213,115,0.05) 0%, rgba(46,213,115,0.02) 100%)',
                    border: '1px solid rgba(46,213,115,0.2)',
                    borderRadius: 3, backdropFilter: 'blur(8px)',
                    p: 2, height: '100%', display: 'flex', flexDirection: 'column',
                }}
            >
                <Typography variant="subtitle2" sx={{
                    mb: 1.5, fontWeight: 600, color: '#2ed573',
                    textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem',
                }}>
                    Tasks ({tasks.length})
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflow: 'auto' }}>
                    {tasks.map(task => (
                        <Box
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            sx={{
                                p: 1.5, borderRadius: 2,
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
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box sx={{
                                    width: 16, height: 16, borderRadius: 0.5,
                                    border: task.completed ? 'none'
                                        : task.priority === 'high' ? '2px solid #ff4757' : '2px solid #ffa502',
                                    background: task.completed
                                        ? 'linear-gradient(135deg, #2ed573 0%, #26d467 100%)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, fontSize: '10px', color: '#fff', fontWeight: 'bold',
                                }}>
                                    {task.completed && '✓'}
                                </Box>
                                <Typography variant="subtitle2" sx={{
                                    fontWeight: 600,
                                    color: task.completed ? '#2ed573' : '#ffa502',
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    fontSize: '0.85rem', lineHeight: 1.3,
                                }}>
                                    {task.title}
                                </Typography>
                            </Box>

                            {task.description && (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', pl: 3.5 }}>
                                    {task.description}
                                </Typography>
                            )}

                            {task.estimatedHours && (
                                <Typography variant="caption" sx={{
                                    color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', pl: 3.5, mt: 0.25, display: 'block',
                                }}>
                                    Est. {task.estimatedHours}h
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default TasksPanel;
