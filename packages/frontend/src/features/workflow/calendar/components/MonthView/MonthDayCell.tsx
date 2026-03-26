import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import { isToday } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { getEventColor } from '@/features/workflow/calendar/constants/calendar-config';

interface MonthDayCellProps {
    day: Date;
    isCurrentMonth: boolean;
    dayEvents: CalendarEvent[];
    dayTasks: CalendarTask[];
    moreCount: number;
    onDateClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    onTaskClick: (task: CalendarTask) => void;
    onMouseEnter: (day: Date, e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
}

const MonthDayCell: React.FC<MonthDayCellProps> = ({
    day, isCurrentMonth, dayEvents, dayTasks, moreCount,
    onDateClick, onEventClick, onTaskClick, onMouseEnter, onMouseLeave,
}) => {
    const isTodayDate = isToday(day);
    const totalItems = dayEvents.length + dayTasks.length;

    return (
        <Box
            onMouseEnter={(e) => onMouseEnter(day, e)}
            onMouseLeave={onMouseLeave}
            onClick={() => onDateClick(day)}
            sx={{
                position: 'relative', cursor: 'pointer', borderRadius: 3, overflow: 'hidden',
                background: isTodayDate
                    ? 'linear-gradient(135deg, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0.15) 50%, rgba(74,144,226,0.2) 100%)'
                    : !isCurrentMonth
                        ? 'linear-gradient(135deg, rgba(45,45,45,0.4) 0%, rgba(35,35,35,0.6) 50%, rgba(30,30,30,0.5) 100%)'
                        : 'linear-gradient(135deg, rgba(50,50,50,0.7) 0%, rgba(30,30,30,0.9) 50%, rgba(25,25,25,0.8) 100%)',
                border: isTodayDate ? '2px solid #4A90E2'
                    : totalItems > 0 && isCurrentMonth ? '1px solid rgba(74,144,226,0.4)' : '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-3px) scale(1.03)',
                    background: isTodayDate
                        ? 'linear-gradient(135deg, rgba(74,144,226,0.35) 0%, rgba(74,144,226,0.25) 50%, rgba(74,144,226,0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(70,70,70,0.9) 0%, rgba(50,50,50,1) 50%, rgba(45,45,45,0.9) 100%)',
                    boxShadow: isTodayDate
                        ? '0 25px 50px rgba(74,144,226,0.4), 0 0 30px rgba(74,144,226,0.3), 0 0 0 1px rgba(74,144,226,0.5)'
                        : '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.1), 0 0 0 1px rgba(74,144,226,0.3)',
                    border: isTodayDate ? '2px solid #4A90E2' : '1px solid rgba(74,144,226,0.6)',
                    zIndex: 10,
                },
                display: 'flex', flexDirection: 'column', p: 1.5, minHeight: 0,
                ...(isTodayDate && {
                    boxShadow: '0 15px 30px rgba(74,144,226,0.2), 0 0 15px rgba(74,144,226,0.15)',
                    '&::before': {
                        content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(45deg, transparent 30%, rgba(74,144,226,0.08) 50%, transparent 70%)',
                        animation: 'calShimmer 4s ease-in-out infinite', pointerEvents: 'none',
                    },
                }),
            }}
        >
            {/* Day Number */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, minHeight: 24 }}>
                <Typography variant="h6" sx={{
                    fontWeight: isTodayDate ? 600 : 200,
                    color: isTodayDate ? '#4A90E2' : isCurrentMonth ? '#ffffff' : 'rgba(200,200,200,0.8)',
                    fontSize: isTodayDate ? '1rem' : '.8rem',
                    textShadow: isTodayDate ? '0 0 15px rgba(74,144,226,0.6), 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.4)',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.02em',
                }}>
                    {day.getDate()}
                </Typography>
            </Box>

            {/* Events */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, minHeight: 0, overflow: 'hidden' }}>
                {dayEvents.map(event => (
                    <Box key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        sx={{
                            height: 20, borderRadius: 2,
                            background: `linear-gradient(135deg, ${getEventColor(event.type)}CC 0%, ${getEventColor(event.type)}99 50%, ${getEventColor(event.type)}BB 100%)`,
                            cursor: 'pointer', opacity: isCurrentMonth ? 1 : 0.6,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden', display: 'flex', alignItems: 'center', px: 1.5, position: 'relative',
                            backdropFilter: 'blur(6px) saturate(1.1)',
                            border: `1px solid ${getEventColor(event.type)}55`,
                            boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
                            '&:hover': {
                                background: `linear-gradient(135deg, ${getEventColor(event.type)}DD 0%, ${getEventColor(event.type)}AA 50%, ${getEventColor(event.type)}CC 100%)`,
                                transform: 'translateY(-1px) scale(1.02)', zIndex: 5,
                                boxShadow: `0 6px 16px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px ${getEventColor(event.type)}66, 0 0 15px ${getEventColor(event.type)}33`,
                                backdropFilter: 'blur(8px) saturate(1.2)',
                            },
                            '&::before': {
                                content: '""', position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                                transition: 'left 0.5s ease',
                            },
                            '&:hover::before': { left: '100%' },
                        }}
                    >
                        <Typography variant="caption" sx={{
                            fontSize: '0.7rem', fontWeight: 600, color: '#ffffff',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            letterSpacing: '0.02em', position: 'relative', zIndex: 1,
                        }}>
                            {event.title}
                        </Typography>
                    </Box>
                ))}

                {/* More indicator */}
                {moreCount > 0 && (
                    <Box sx={{
                        mt: 0.5, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 1.5,
                        background: 'linear-gradient(135deg, rgba(74,144,226,0.15) 0%, rgba(74,144,226,0.08) 100%)',
                        border: '1px dashed rgba(74,144,226,0.4)', backdropFilter: 'blur(4px)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
                        position: 'relative', overflow: 'hidden',
                        '&:hover': {
                            background: 'linear-gradient(135deg, rgba(74,144,226,0.25) 0%, rgba(74,144,226,0.15) 100%)',
                            transform: 'scale(1.05)', border: '1px dashed rgba(74,144,226,0.6)',
                            boxShadow: '0 4px 12px rgba(74,144,226,0.2), 0 0 8px rgba(74,144,226,0.1)',
                        },
                        '&::before': {
                            content: '""', position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(74,144,226,0.2), transparent)',
                            transition: 'left 0.4s ease',
                        },
                        '&:hover::before': { left: '100%' },
                    }}>
                        <Typography variant="caption" sx={{
                            fontSize: '0.65rem', color: 'rgba(74,144,226,0.9)', fontWeight: 600,
                            opacity: isCurrentMonth ? 1 : 0.6,
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            letterSpacing: '0.02em', textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            position: 'relative', zIndex: 1,
                        }}>
                            +{moreCount} more
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Task checkboxes */}
            {dayTasks.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', mt: 1, pt: 0.75, borderTop: '1px solid rgba(74,144,226,0.3)' }}>
                    {dayTasks.map(task => (
                        <Box key={task.id}
                            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                            sx={{
                                width: 12, height: 12, borderRadius: 2,
                                border: task.completed ? 'none'
                                    : task.priority === 'high' ? '2px solid #ff4757'
                                    : task.priority === 'medium' ? '2px solid #ffa502' : '2px solid #95a5a6',
                                background: task.completed ? 'linear-gradient(135deg, #2ed573 0%, #26d467 100%)' : 'transparent',
                                cursor: 'pointer', opacity: isCurrentMonth ? 1 : 0.6,
                                transition: 'all 0.2s ease', position: 'relative',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                '&:hover': { transform: 'scale(1.2)', zIndex: 5 },
                                '&::after': task.completed ? {
                                    content: '"✓"', color: '#ffffff', fontSize: '8px', fontWeight: 'bold',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                } : {},
                            }}
                            title={`${task.title}${task.dueDate ? ` (Due: ${task.dueDate.toLocaleDateString()})` : ''} - ${task.completed ? 'Completed' : 'Pending'}`}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default MonthDayCell;
