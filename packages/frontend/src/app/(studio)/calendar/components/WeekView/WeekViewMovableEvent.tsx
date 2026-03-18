"use client";

import React, { useEffect, useState } from 'react';
import { useDraggable, DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { CalendarEvent } from '../../types';

interface WeekViewMovableEventProps {
    event: CalendarEvent;
    dayIndex: number; // Which day column this event is in (0-6)
    children: React.ReactNode | ((dragHandleProps: {
        listeners: SyntheticListenerMap | undefined;
        attributes: DraggableAttributes;
        isDragging: boolean;
        dragPreview: { x: number; y: number } | null;
    }) => React.ReactNode);
}

export const WeekViewMovableEvent: React.FC<WeekViewMovableEventProps> = ({
    event,
    dayIndex,
    children
}) => {
    const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useDraggable({
        id: `event-${event.id}`,
        data: {
            event,
            originalDate: new Date(event.start),
            originalStartTime: new Date(event.start),
            originalEndTime: new Date(event.end),
            dayIndex
        }
    });

    // Handle snapping while dragging
    useEffect(() => {
        if (isDragging && transform) {
            // Get the actual calendar container width instead of window width
            const calendarContainer = document.querySelector('[data-calendar-container]');
            const containerWidth = calendarContainer ? calendarContainer.clientWidth : 800; // fallback

            // Calculate day column width more accurately
            // After 100px hour labels, remaining width is split into 7 day columns
            const availableWidth = containerWidth - 100; // subtract hour label width
            const dayColumnWidth = availableWidth / 7;

            const snapToMinutes = 15;
            const pixelsPerMinute = 80 / 60; // 80px per hour

            // Snap horizontal movement to day columns with smaller threshold
            let snappedX = transform.x;
            const dayOffset = Math.round(transform.x / dayColumnWidth);

            // Allow movement to any day within the week (0-6), but clamp to bounds
            const clampedDayOffset = Math.max(-dayIndex, Math.min(6 - dayIndex, dayOffset));
            snappedX = clampedDayOffset * dayColumnWidth;

            // Snap vertical movement to 15-minute intervals
            let snappedY = transform.y;
            const minuteOffset = Math.round(transform.y / pixelsPerMinute / snapToMinutes) * snapToMinutes;
            snappedY = minuteOffset * pixelsPerMinute;

            // Clamp vertical movement to reasonable bounds (prevent flying off screen)
            const maxVerticalOffset = 24 * 80; // 24 hours * 80px per hour
            snappedY = Math.max(-maxVerticalOffset, Math.min(maxVerticalOffset, snappedY));

            setDragPreview({ x: snappedX, y: snappedY });
        } else {
            setDragPreview(null);
        }
    }, [isDragging, transform, dayIndex]);

    const style = {
        transform: dragPreview
            ? `translate3d(${dragPreview.x}px, ${dragPreview.y}px, 0)`
            : transform
                ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
                : undefined,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative' as const // Ensure proper positioning context
    };

    return (
        <div ref={setNodeRef} style={style}>
            {typeof children === 'function'
                ? children({ listeners, attributes, isDragging, dragPreview })
                : <div {...listeners} {...attributes}>{children}</div>
            }
        </div>
    );
};
