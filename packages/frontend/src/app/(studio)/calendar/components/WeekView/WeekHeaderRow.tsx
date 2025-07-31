import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarEvent, CalendarTask } from '../../types';
import WeekDayHeader from './WeekDayHeader';

interface WeekHeaderRowProps {
    weekDays: Date[];
    dayNames: string[];
    events: CalendarEvent[];
    tasks: CalendarTask[];
    onDateClick: (date: Date) => void;
    getDayTasks: (date: Date) => CalendarTask[];
}

const WeekHeaderRow: React.FC<WeekHeaderRowProps> = ({
    weekDays,
    dayNames,
    events,
    tasks,
    onDateClick,
    getDayTasks
}) => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: '100px repeat(7, 1fr)',
                gap: 0,
                mb: 0,
                px: 2,
                pt: 1,
                position: 'relative',
                zIndex: 1
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
                    height: '60px'
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

            {/* Day headers - Compact */}
            {weekDays.map((day, index) => (
                <WeekDayHeader
                    key={day.toISOString()}
                    day={day}
                    index={index}
                    dayName={dayNames[index]}
                    events={events}
                    tasks={tasks}
                    onDateClick={onDateClick}
                    getDayTasks={getDayTasks}
                />
            ))}
        </Box>
    );
};

export default WeekHeaderRow;
