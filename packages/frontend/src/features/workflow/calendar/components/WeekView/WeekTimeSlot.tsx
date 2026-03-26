import React from 'react';
import { Box } from '@mui/material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { isToday } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { WeekViewDroppableTimeSlot } from './WeekViewDroppableTimeSlot';
import { useDndContext } from '@dnd-kit/core';

interface WeekTimeSlotProps {
    day: Date;
    hour: number;
    dayIndex: number;
    dayEvents: CalendarEvent[];
    handleHourSlotClick: (day: Date, hour: number) => void;
}

const WeekTimeSlot: React.FC<WeekTimeSlotProps> = ({
    day,
    hour,
    dayIndex,
    dayEvents,
    handleHourSlotClick
}) => {
    const isTodayDate = isToday(day);
    const { active } = useDndContext(); // Detect if something is being dragged

    // Check if there are events in this time slot for this day
    const hasEventsInSlot = dayEvents.some(event => {
        if (event.allDay) return false;
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Create hour slot boundaries
        const slotStart = new Date(day);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(day);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check if event overlaps with this hour slot
        return eventStart < slotEnd && eventEnd > slotStart;
    });

    return (
        <Box
            sx={{
                position: 'relative',
                height: '100%'
            }}
        >
            {/* Main time slot content - prioritized for hover */}
            <Box
                onClick={() => {
                    console.log('🖱️ WeekView CLICKED hour slot:', hour, 'on', day.toDateString(), 'which is', `${hour}:00`, 'to', `${hour + 1}:00`);
                    handleHourSlotClick(day, hour);
                }}
                sx={{
                    p: 0.75,
                    borderRight: dayIndex < 6 ? '1px solid rgba(74,144,226,0.08)' : 'none',
                    background: isTodayDate
                        ? 'linear-gradient(135deg, rgba(74,144,226,0.02) 0%, rgba(74,144,226,0.01) 100%)'
                        : 'transparent',
                    position: 'relative',
                    minHeight: '80px',
                    minWidth: 0,
                    overflow: 'visible',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    zIndex: 10, // High z-index to ensure hover works
                    '&:hover': {
                        background: isTodayDate
                            ? 'linear-gradient(135deg, rgba(74,144,226,0.08) 0%, rgba(74,144,226,0.04) 100%)'
                            : 'rgba(74,144,226,0.02)',
                        // Add subtle background for plus button area when events are present (only if not dragging)
                        '&::before': hasEventsInSlot && !active ? {
                            content: '""',
                            position: 'absolute',
                            top: '25%',
                            right: '4px',
                            width: '28px',
                            height: '50%',
                            backgroundColor: 'rgba(74,144,226,0.03)',
                            borderRadius: '4px',
                            zIndex: 1,
                            transition: 'all 0.2s ease-out'
                        } : {},
                        // Only show plus button if not dragging
                        '&::after': !active ? {
                            content: '"+"',
                            position: 'absolute',
                            top: '50%',
                            right: hasEventsInSlot ? '8px' : 'auto', // 8px from right edge if events
                            left: hasEventsInSlot ? 'auto' : '50%', // Centered if no events
                            transform: hasEventsInSlot ? 'translateY(-50%)' : 'translate(-50%, -50%)',
                            width: hasEventsInSlot ? '18px' : '20px', // Smaller and less prominent
                            height: hasEventsInSlot ? '18px' : '20px',
                            borderRadius: '50%',
                            fontSize: hasEventsInSlot ? '0.7rem' : '0.8rem',
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 500, // Less bold
                            backgroundColor: 'rgba(74,144,226,0.7)', // Less vibrant
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: hasEventsInSlot ? '1px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.7)',
                            boxShadow: hasEventsInSlot
                                ? '0 1px 4px rgba(74,144,226,0.4), 0 0 0 1px rgba(74,144,226,0.2)' // Very subtle
                                : '0 2px 8px rgba(74,144,226,0.3), 0 0 0 1px rgba(74,144,226,0.2)', // Less prominent
                            zIndex: 50, // Very high to ensure visibility above everything
                            transition: 'all 0.2s ease-out',
                            opacity: 0.8, // Slightly transparent
                            cursor: 'pointer',
                            '&:hover': {
                                transform: hasEventsInSlot ? 'translateY(-50%) scale(1.1)' : 'translate(-50%, -50%) scale(1.1)',
                                backgroundColor: 'rgba(74,144,226,0.85)',
                                opacity: 1,
                                boxShadow: '0 3px 12px rgba(74,144,226,0.4), 0 0 0 1px rgba(74,144,226,0.3)'
                            }
                        } : {}
                    }
                }}
            >
                {/* Empty slot - events are now rendered as seamless blocks above */}
            </Box>

            {/* Create 4 drop zones for 15-minute intervals - positioned behind main slot */}
            {[0, 15, 30, 45].map((minute, index) => (
                <WeekViewDroppableTimeSlot
                    key={`${hour}-${minute}`}
                    date={day}
                    hour={hour}
                    minute={minute}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: `${index * 25}%`,
                            left: 0,
                            right: 0,
                            height: '25%',
                            zIndex: 1, // Much lower than main time slot
                            pointerEvents: 'none', // Don't interfere with hover
                        }}
                    />
                </WeekViewDroppableTimeSlot>
            ))}
        </Box>
    );
};

export default WeekTimeSlot;