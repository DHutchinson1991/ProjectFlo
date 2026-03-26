import React, { useState } from 'react';
import { Box, Typography, Collapse } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { CalendarEvent, CalendarTask } from '@/features/workflow/calendar/types/calendar-types';
import WeekDayHeader from './WeekDayHeader';
import WeekTaskCard from './WeekTaskCard';

interface WeekHeaderRowProps {
    weekDays: Date[];
    dayNames: string[];
    events: CalendarEvent[];
    tasks: CalendarTask[];
    onDateClick: (date: Date) => void;
    getDayTasks: (date: Date) => CalendarTask[];
    onTaskClick?: (task: CalendarTask) => void;
}

const WeekHeaderRow: React.FC<WeekHeaderRowProps> = ({
    weekDays,
    dayNames,
    events,
    tasks,
    onDateClick,
    getDayTasks,
    onTaskClick = () => { }
}) => {
    const totalTasks = weekDays.reduce((sum, day) => sum + getDayTasks(day).length, 0);
    const completedTasks = weekDays.reduce((sum, day) => sum + getDayTasks(day).filter(t => t.completed).length, 0);
    const [expanded, setExpanded] = useState(totalTasks > 0);

    return (
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Header Row */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '100px repeat(7, 1fr)',
                    gap: 0,
                    mb: 0,
                    px: 2,
                    pt: 1,
                }}
            >
                {/* Time column header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 1,
                        px: 0.5,
                        borderRadius: '8px 0 0 0',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRight: 'none',
                        backdropFilter: 'blur(8px)',
                        height: '60px',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 600,
                            color: 'rgba(240,240,240,0.8)',
                            letterSpacing: 1,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                    >
                        TIME
                    </Typography>
                </Box>

                {/* Day headers */}
                {weekDays.map((day, index) => (
                    <WeekDayHeader
                        key={day.toISOString()}
                        day={day}
                        index={index}
                        dayName={dayNames[index]}
                        events={events}
                        dayTasks={getDayTasks(day)}
                        onDateClick={onDateClick}
                    />
                ))}
            </Box>

            {/* Tasks Strip - Subtle inline bar */}
            {totalTasks > 0 && (
                <Box
                    onClick={() => setExpanded(!expanded)}
                    sx={{
                        mx: 2,
                        mt: 0,
                        px: 1.5,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s ease',
                        userSelect: 'none',
                        '&:hover': {
                            background: 'rgba(255,255,255,0.06)',
                        }
                    }}
                >
                    <KeyboardArrowDownIcon
                        sx={{
                            fontSize: '1rem',
                            color: 'rgba(255,255,255,0.35)',
                            transition: 'transform 0.2s ease',
                            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        }}
                    />

                    <Typography
                        sx={{
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: '0.7rem',
                            letterSpacing: 0.3,
                        }}
                    >
                        {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                    </Typography>

                    {completedTasks > 0 && (
                        <Typography
                            sx={{
                                fontWeight: 500,
                                color: 'rgba(46,213,115,0.45)',
                                fontSize: '0.65rem',
                            }}
                        >
                            · {completedTasks} done
                        </Typography>
                    )}
                </Box>
            )}

            {/* Expandable Tasks Drawer */}
            <Collapse in={expanded} timeout={200}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '100px repeat(7, 1fr)',
                        gap: 0,
                        px: 2,
                        py: 0.5,
                        mx: 2,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                    }}
                >
                    {/* Label cell */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            pt: 0.5,
                            px: 0.5,
                        }}
                    />

                    {/* Task cards per day column */}
                    {weekDays.map((day, index) => {
                        const dayTasksList = getDayTasks(day);
                        return (
                            <Box
                                key={day.toISOString()}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                    p: 0.5,
                                    borderLeft: '1px solid rgba(255,255,255,0.04)',
                                    minHeight: 40,
                                }}
                            >
                                {dayTasksList.length > 0 ? (
                                    dayTasksList.map(task => (
                                        <WeekTaskCard
                                            key={task.id}
                                            task={task}
                                            onTaskClick={onTaskClick}
                                        />
                                    ))
                                ) : null}
                            </Box>
                        );
                    })}
                </Box>
            </Collapse>
        </Box>
    );
};

export default WeekHeaderRow;
