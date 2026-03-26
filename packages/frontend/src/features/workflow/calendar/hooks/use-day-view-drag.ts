import { useState, useCallback, useEffect } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { createDragDropHandler } from '../utils/drag-drop-utils';

interface DragState {
    eventId: string;
    direction: 'top' | 'bottom';
    startY: number;
    originalStart: Date;
    originalEnd: Date;
    currentStart: Date | null;
    currentEnd: Date | null;
}

interface UseDayViewDragOptions {
    events: CalendarEvent[];
    onEventUpdate?: (eventId: string, updateData: { start: Date; end: Date }) => Promise<void>;
}

export function useDayViewDrag({ events, onEventUpdate }: UseDayViewDragOptions) {
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [justFinishedDragging, setJustFinishedDragging] = useState(false);
    const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

    const dragDropHandler = useCallback(
        createDragDropHandler({ onEventUpdate }),
        [onEventUpdate]
    );

    const handleDnDEnd = useCallback(async (event: DragEndEvent) => {
        await dragDropHandler(event);
        setActiveEvent(null);
    }, [dragDropHandler]);

    const handleDragStart = useCallback(
        (e: React.MouseEvent, event: CalendarEvent, direction: 'top' | 'bottom') => {
            e.stopPropagation();
            setDragState({
                eventId: event.id,
                direction,
                startY: e.clientY,
                originalStart: new Date(event.start),
                originalEnd: new Date(event.end),
                currentStart: null,
                currentEnd: null,
            });
        },
        []
    );

    const handleDragMove = useCallback(
        (e: MouseEvent) => {
            if (!dragState) return;
            const deltaY = e.clientY - dragState.startY;
            if (Math.abs(deltaY) < 10) return;

            const minutesDelta = Math.round((deltaY / 80) * 60 / 15) * 15;
            let newStart = new Date(dragState.originalStart);
            let newEnd = new Date(dragState.originalEnd);

            if (dragState.direction === 'top') {
                newStart = new Date(dragState.originalStart.getTime() + minutesDelta * 60 * 1000);
                if (newStart >= dragState.originalEnd) {
                    newStart = new Date(dragState.originalEnd.getTime() - 15 * 60 * 1000);
                }
            } else {
                newEnd = new Date(dragState.originalEnd.getTime() + minutesDelta * 60 * 1000);
                if (newEnd <= dragState.originalStart) {
                    newEnd = new Date(dragState.originalStart.getTime() + 15 * 60 * 1000);
                }
            }

            if (
                newStart.getTime() !== dragState.originalStart.getTime() ||
                newEnd.getTime() !== dragState.originalEnd.getTime()
            ) {
                setDragState(prev =>
                    prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : null
                );
            }
        },
        [dragState]
    );

    const handleDragEnd = useCallback(async () => {
        if (!dragState || !dragState.currentStart || !dragState.currentEnd) return;
        setJustFinishedDragging(true);

        try {
            const eventToUpdate = events.find(e => e.id === dragState.eventId);
            if (eventToUpdate && onEventUpdate) {
                await onEventUpdate(eventToUpdate.id, {
                    start: dragState.currentStart,
                    end: dragState.currentEnd,
                });
            }
        } catch (error) {
            console.error('Error updating event:', error);
        } finally {
            setDragState(null);
            setTimeout(() => setJustFinishedDragging(false), 100);
        }
    }, [dragState, events, onEventUpdate]);

    useEffect(() => {
        if (dragState) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.body.style.cursor = dragState.direction === 'top' ? 'n-resize' : 's-resize';
            document.body.style.userSelect = 'none';

            return () => {
                document.removeEventListener('mousemove', handleDragMove);
                document.removeEventListener('mouseup', handleDragEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [dragState, handleDragMove, handleDragEnd]);

    return {
        dragState,
        justFinishedDragging,
        activeEvent,
        handleDnDEnd,
        handleDragStart,
    };
}
