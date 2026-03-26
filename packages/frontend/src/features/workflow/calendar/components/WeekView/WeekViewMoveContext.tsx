"use client";

import React from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';

interface WeekViewMoveContextProps {
    children: React.ReactNode;
    onDragEnd: (event: DragEndEvent) => void;
    onDragStart?: (event: DragStartEvent) => void;
    activeEvent: CalendarEvent | null;
}

export const WeekViewMoveContext: React.FC<WeekViewMoveContextProps> = ({
    children,
    onDragEnd,
    onDragStart
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
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            {children}
            {/* No DragOverlay - we handle drag preview in the event component itself */}
        </DndContext>
    );
};
