"use client";

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import { CalendarEvent } from '../../types';
import { DragData } from './types';

interface DraggableEventProps {
    event: CalendarEvent;
    children: React.ReactNode;
}

export const DraggableEvent: React.FC<DraggableEventProps> = ({
    event,
    children
}) => {
    const dragData: DragData = {
        event,
        originalDate: new Date(event.start),
        originalStartTime: new Date(event.start),
        originalEndTime: new Date(event.end)
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging: dndIsDragging
    } = useDraggable({
        id: `event-${event.id}`,
        data: dragData
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: dndIsDragging ? 1000 : 'auto',
        opacity: dndIsDragging ? 0.8 : 1,
        cursor: dndIsDragging ? 'grabbing' : 'grab'
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            sx={{
                position: 'relative',
                '&:hover': {
                    '&::after': {
                        content: '"⋮⋮"',
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '12px',
                        lineHeight: '1',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '2px',
                        padding: '2px 4px',
                        pointerEvents: 'none',
                        zIndex: 5
                    }
                },
                ...(dndIsDragging && {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    transform: 'rotate(3deg) scale(1.05)',
                    transition: 'none'
                })
            }}
        >
            {children}
        </Box>
    );
};
