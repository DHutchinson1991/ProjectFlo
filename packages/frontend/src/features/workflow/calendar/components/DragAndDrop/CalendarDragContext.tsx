"use client";

import React from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { Box, Typography } from '@mui/material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { getEventColor } from '@/features/workflow/calendar/constants/calendar-config';
import { formatTime } from '@/features/workflow/calendar/utils/calendar-date-helpers';

interface CalendarDragContextProps {
    children: React.ReactNode;
    onDragEnd: (event: DragEndEvent) => void;
    activeEvent: CalendarEvent | null;
}

export const CalendarDragContext: React.FC<CalendarDragContextProps> = ({
    children,
    onDragEnd,
    activeEvent
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        })
    );

    return (
        <DndContext
            sensors={sensors}
            onDragEnd={onDragEnd}
        >
            {children}
            <DragOverlay dropAnimation={null}>
                {activeEvent && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                                ${getEventColor(activeEvent.type)}DD 0%, 
                                ${getEventColor(activeEvent.type)}AA 50%,
                                ${getEventColor(activeEvent.type)}CC 100%)`,
                            border: `1px solid ${getEventColor(activeEvent.type)}55`,
                            backdropFilter: 'blur(6px) saturate(1.1)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                            transform: 'rotate(3deg) scale(1.05)',
                            opacity: 0.9,
                            maxWidth: '200px',
                            cursor: 'grabbing'
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#ffffff',
                                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                mb: 0.5
                            }}
                        >
                            {activeEvent.title}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255,255,255,0.8)',
                                display: 'block',
                                fontSize: '0.75rem'
                            }}
                        >
                            {formatTime(activeEvent.start)} - {formatTime(activeEvent.end)}
                        </Typography>
                        {activeEvent.location && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'rgba(255,255,255,0.7)',
                                    display: 'block',
                                    fontSize: '0.7rem',
                                    mt: 0.25
                                }}
                            >
                                📍 {activeEvent.location}
                            </Typography>
                        )}
                    </Box>
                )}
            </DragOverlay>
        </DndContext>
    );
};
