"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box } from '@mui/material';
import { TimeSlotDropData } from './types';

interface DroppableTimeSlotProps {
    date: Date;
    hour: number;
    children: React.ReactNode;
    onCreateEvent?: (eventData: { start: Date; end: Date; title: string }) => void;
    hasEvents?: boolean; // Whether this time slot already has events
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
    date,
    hour,
    children,
    onCreateEvent,
    hasEvents = false
}) => {
    const dropData: TimeSlotDropData = {
        type: 'timeSlot',
        date,
        time: hour,
        timeSlot: `${date.toISOString().split('T')[0]}-${hour}`
    };

    const {
        isOver,
        setNodeRef
    } = useDroppable({
        id: `timeslot-${dropData.timeSlot}`,
        data: dropData
    });

    // Format hour display
    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    const handleClick = () => {
        if (!onCreateEvent) return;

        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);

        const defaultTitle = `New Event ${formatHour(hour)}`;

        onCreateEvent({
            start: startTime,
            end: endTime,
            title: defaultTitle
        });
    };

    return (
        <Box
            ref={setNodeRef}
            onClick={handleClick}
            sx={{
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isOver
                    ? 'rgba(74, 144, 226, 0.15)'
                    : 'transparent',
                borderRadius: isOver ? 1 : 0,
                border: isOver
                    ? '2px dashed rgba(74, 144, 226, 0.5)'
                    : '2px dashed transparent',
                '&:hover': {
                    backgroundColor: 'rgba(74,144,226,0.02)',
                    // Only show the "+" icon if there are no events in this time slot
                    ...(!hasEvents && {
                        '&::after': {
                            content: '"+"',
                            position: 'absolute',
                            top: '50%',
                            right: '8px',
                            transform: 'translateY(-50%)',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            fontSize: '0.9rem',
                            color: '#ffffff',
                            fontWeight: 700,
                            backgroundColor: '#4A90E2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 3px 12px rgba(74,144,226,0.5), 0 0 0 1px rgba(74,144,226,0.3)',
                            zIndex: 10,
                            transition: 'opacity 0.2s ease-out',
                            opacity: 1
                        }
                    })
                },
                ...(isOver && {
                    '&::before': {
                        content: '"Drop here to move event"',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(74, 144, 226, 0.9)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap'
                    }
                })
            }}
        >
            {children}
        </Box>
    );
};
