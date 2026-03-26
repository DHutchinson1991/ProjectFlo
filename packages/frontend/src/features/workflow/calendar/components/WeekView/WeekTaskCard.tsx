import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarTask } from '@/features/workflow/calendar/types/calendar-types';

interface WeekTaskCardProps {
    task: CalendarTask;
    onTaskClick: (task: CalendarTask) => void;
}

const WeekTaskCard: React.FC<WeekTaskCardProps> = ({ task, onTaskClick }) => (
    <Box
        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
        sx={{
            p: 0.75,
            borderRadius: 1,
            background: task.completed
                ? 'rgba(46,213,115,0.06)'
                : 'rgba(255,165,2,0.06)',
            border: `1px solid ${task.completed ? 'rgba(46,213,115,0.2)' : 'rgba(255,165,2,0.2)'}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
                background: task.completed
                    ? 'rgba(46,213,115,0.12)'
                    : 'rgba(255,165,2,0.12)',
            }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
                sx={{
                    width: 10,
                    height: 10,
                    borderRadius: 0.5,
                    border: task.completed
                        ? 'none'
                        : task.priority === 'high'
                            ? '2px solid #ff4757'
                            : '2px solid #ffa502',
                    background: task.completed
                        ? 'linear-gradient(135deg, #2ed573 0%, #26d467 100%)'
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '7px',
                    color: '#fff',
                    fontWeight: 'bold'
                }}
            >
                {task.completed && '\u2713'}
            </Box>
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 600,
                    color: task.completed ? '#2ed573' : '#ffa502',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    fontSize: '0.65rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                }}
            >
                {task.title}
            </Typography>
        </Box>
    </Box>
);

export default WeekTaskCard;
