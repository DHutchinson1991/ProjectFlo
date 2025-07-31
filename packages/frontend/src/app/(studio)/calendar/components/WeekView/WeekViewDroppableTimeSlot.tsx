"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface WeekViewDroppableTimeSlotProps {
    date: Date;
    hour: number;
    minute?: number; // Support 15-minute intervals
    children: React.ReactNode;
}

export const WeekViewDroppableTimeSlot: React.FC<WeekViewDroppableTimeSlotProps> = ({
    date,
    hour,
    minute = 0,
    children
}) => {
    const timeValue = hour + (minute / 60); // Convert to decimal hours for finer granularity

    const {
        isOver,
        setNodeRef
    } = useDroppable({
        id: `timeslot-${date.toISOString()}-${hour}-${minute}`,
        data: {
            type: 'timeSlot',
            date,
            time: timeValue, // Use decimal hour for 15-minute precision
            timeSlot: `${hour}:${minute.toString().padStart(2, '0')}`
        }
    });

    const style = {
        backgroundColor: isOver ? 'rgba(74, 144, 226, 0.15)' : undefined,
        transition: 'background-color 0.2s ease',
        outline: isOver ? '2px solid rgba(74, 144, 226, 0.3)' : undefined,
        borderRadius: isOver ? '4px' : undefined
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children}
        </div>
    );
};
