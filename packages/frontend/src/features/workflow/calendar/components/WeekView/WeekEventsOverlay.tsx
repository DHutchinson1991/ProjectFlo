import React, { useRef, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { WeekViewMovableEvent } from './WeekViewMovableEvent';
import WeekEventBlock from './WeekEventBlock';

type ExtendedCalendarEvent = CalendarEvent & {
    top: number;
    height: number;
    leftOffsetPercent?: number;
    widthPercent?: number;
    isSpanningEvent?: boolean;
    spanStartDay?: boolean;
    spanEndDay?: boolean;
};

interface WeekEventsOverlayProps {
    eventsWithPositionsByDay: Array<{ day: Date; events: ExtendedCalendarEvent[] }>;
    dragState?: {
        eventId: string;
        currentStart: Date | null;
        currentEnd: Date | null;
        originalStart: Date;
        originalEnd: Date;
    } | null;
    justFinishedDragging: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onEventDelete?: (event: CalendarEvent) => void;
    handleDragStart: (e: React.MouseEvent, event: CalendarEvent, handle: 'top' | 'bottom') => void;
    setHoveredEvent: (id: string | null) => void;
}

interface DayColumnDimensions { left: number; width: number }

const WeekEventsOverlay: React.FC<WeekEventsOverlayProps> = ({
    eventsWithPositionsByDay,
    dragState,
    justFinishedDragging,
    onEventClick,
    onEventDelete,
    handleDragStart,
    setHoveredEvent,
}) => {
    const [dayColumnDimensions, setDayColumnDimensions] = useState<DayColumnDimensions[]>([]);
    const [hoveredEvent, setHoveredEventLocal] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const measureDayColumns = () => {
            const container = document.querySelector('[data-calendar-container]');
            if (!container) return;
            const firstHourRow = container.querySelector('[data-hour="0"]');
            if (!firstHourRow) return;
            const dayColumns = firstHourRow.querySelectorAll('[data-day-index]');
            const containerRect = container.getBoundingClientRect();
            const dimensions: DayColumnDimensions[] = [];
            dayColumns.forEach(column => {
                const rect = column.getBoundingClientRect();
                dimensions.push({ left: rect.left - containerRect.left, width: rect.width });
            });
            setDayColumnDimensions(dimensions);
        };

        measureDayColumns();
        requestAnimationFrame(measureDayColumns);
        window.addEventListener('resize', measureDayColumns);
        return () => window.removeEventListener('resize', measureDayColumns);
    }, [eventsWithPositionsByDay]);

    return (
        <Box
            ref={overlayRef}
            sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}
        >
            {eventsWithPositionsByDay.map((dayData, dayIndex) =>
                dayData.events.filter(event => !event.allDay).map(event => {
                    const isBeingDragged = dragState?.eventId === event.id;
                    const hasActualChanges =
                        isBeingDragged &&
                        dragState.currentStart !== null &&
                        dragState.currentEnd !== null &&
                        (dragState.currentStart.getTime() !== dragState.originalStart.getTime() ||
                            dragState.currentEnd.getTime() !== dragState.originalEnd.getTime());

                    const current = hasActualChanges
                        ? { ...event, start: dragState.currentStart!, end: dragState.currentEnd! }
                        : event;
                    const startMinutes = current.start.getHours() * 60 + current.start.getMinutes();
                    const endMinutes = current.end.getHours() * 60 + current.end.getMinutes();
                    const px = 80 / 60;
                    const currentTop = startMinutes * px + current.start.getHours();
                    const currentHeight = Math.max((endMinutes - startMinutes) * px, 15);

                    const dayColumn = dayColumnDimensions[dayIndex];
                    if (!dayColumn) return null;

                    const padding = 4;
                    const plusButtonSpace = 32;
                    const available = dayColumn.width - 2 * padding - plusButtonSpace;
                    let eventLeft: number, eventWidth: number;
                    if (event.widthPercent && event.widthPercent < 100) {
                        eventWidth = available * (event.widthPercent / 100);
                        eventLeft = dayColumn.left + padding + (event.leftOffsetPercent ? available * (event.leftOffsetPercent / 100) : 0);
                    } else {
                        eventWidth = available;
                        eventLeft = dayColumn.left + padding;
                    }

                    return (
                        <WeekViewMovableEvent key={`${event.id}-${dayIndex}`} event={event} dayIndex={dayIndex}>
                            {({ listeners, attributes, isDragging }) => (
                                <WeekEventBlock
                                    event={event}
                                    eventLeft={eventLeft}
                                    eventWidth={eventWidth}
                                    currentTop={currentTop}
                                    currentHeight={currentHeight}
                                    isBeingDragged={isBeingDragged}
                                    hasActualChanges={!!hasActualChanges}
                                    justFinishedDragging={justFinishedDragging}
                                    hoveredEvent={hoveredEvent}
                                    isDragging={isDragging}
                                    listeners={listeners as Record<string, unknown>}
                                    attributes={attributes as unknown as Record<string, unknown>}
                                    onEventClick={onEventClick}
                                    onEventDelete={onEventDelete}
                                    handleDragStart={handleDragStart}
                                    onMouseEnter={() => { setHoveredEvent(event.id); setHoveredEventLocal(event.id); }}
                                    onMouseLeave={() => { setHoveredEvent(null); setHoveredEventLocal(null); }}
                                />
                            )}
                        </WeekViewMovableEvent>
                    );
                })
            )}
        </Box>
    );
};

export default WeekEventsOverlay;
