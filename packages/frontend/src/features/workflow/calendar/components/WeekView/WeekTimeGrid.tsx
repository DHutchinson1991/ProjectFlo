import React from 'react';
import { Box, Paper } from '@mui/material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import WeekHourLabel from './WeekHourLabel';
import WeekTimeSlot from './WeekTimeSlot';

interface WeekTimeGridProps {
    hours: number[];
    weekDays: Date[];
    eventsWithPositionsByDay: Array<{ day: Date; events: CalendarEvent[] }>;
    formatHour: (hour: number) => string;
    handleHourSlotClick: (day: Date, hour: number) => void;
    onCreateEvent?: (eventData: { start: Date; end: Date; title: string; }) => void;
}

const WeekTimeGrid: React.FC<WeekTimeGridProps> = ({
    hours,
    weekDays,
    eventsWithPositionsByDay,
    formatHour,
    handleHourSlotClick,
    onCreateEvent
}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
                borderRadius: '0 0 12px 12px',
                border: '1px solid rgba(74,144,226,0.15)',
                borderTop: 'none',
                backdropFilter: 'blur(20px)',
                position: 'relative'
            }}
        >
            <Box>
                {hours.map((hour) => (
                    <Box key={hour}
                        data-hour={hour}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '100px repeat(7, 1fr)',
                            minHeight: '80px',
                            borderBottom: hour < 23 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                        }}>
                        {/* Hour Label - Clickable for event creation */}
                        <WeekHourLabel
                            hour={hour}
                            onHourSlotClick={handleHourSlotClick}
                            firstDay={weekDays[0]}
                            formatHour={formatHour}
                        />

                        {/* Day Columns - Empty slots for creating events */}
                        {weekDays.map((day, dayIndex) => {
                            const dayData = eventsWithPositionsByDay[dayIndex];

                            return (
                                <Box
                                    key={`${day.toISOString()}-${hour}`}
                                    data-day-index={dayIndex}
                                >
                                    <WeekTimeSlot
                                        day={day}
                                        hour={hour}
                                        dayIndex={dayIndex}
                                        dayEvents={dayData.events}
                                        handleHourSlotClick={handleHourSlotClick}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default WeekTimeGrid;
