import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarEvent } from '../../types';
import { WeekViewMovableEvent } from './WeekViewMovableEvent';
import { getEventColor } from '../../config';
import { formatTime } from '../../utils';

// Extended event type with positioning properties
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

interface DayColumnDimensions {
    left: number;
    width: number;
}

const WeekEventsOverlay: React.FC<WeekEventsOverlayProps> = ({
    eventsWithPositionsByDay,
    dragState,
    justFinishedDragging,
    onEventClick,
    onEventDelete,
    handleDragStart,
    setHoveredEvent
}) => {
    const [dayColumnDimensions, setDayColumnDimensions] = useState<DayColumnDimensions[]>([]);
    const [hoveredEvent, setHoveredEventLocal] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Calculate exact day column positions using DOM measurements
    useEffect(() => {
        const measureDayColumns = () => {
            const calendarContainer = document.querySelector('[data-calendar-container]');
            if (!calendarContainer) return;

            // Find the first row of day columns to measure
            const firstHourRow = calendarContainer.querySelector('[data-hour="0"]');
            if (!firstHourRow) return;

            const dayColumns = firstHourRow.querySelectorAll('[data-day-index]');
            const containerRect = calendarContainer.getBoundingClientRect();

            const dimensions: DayColumnDimensions[] = [];

            dayColumns.forEach((column) => {
                const columnRect = column.getBoundingClientRect();
                dimensions.push({
                    left: columnRect.left - containerRect.left,
                    width: columnRect.width
                });
            });

            setDayColumnDimensions(dimensions);
        };

        // Measure immediately on mount
        measureDayColumns();

        // Also measure on next frame to catch any layout changes
        requestAnimationFrame(measureDayColumns);

        // Measure when window resizes
        window.addEventListener('resize', measureDayColumns);

        return () => {
            window.removeEventListener('resize', measureDayColumns);
        };
    }, [eventsWithPositionsByDay]); // Add dependency to remeasure when events change

    return (
        <Box
            ref={overlayRef}
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none', // Allow clicks to pass through to time slots
                zIndex: 10
            }}
        >
            {/* Seamless events rendered with absolute positioning */}
            {eventsWithPositionsByDay.map((dayData, dayIndex) =>
                dayData.events.filter(event => !event.allDay).map((event) => {
                    // Check if this event is being dragged
                    const isBeingDragged = dragState?.eventId === event.id;

                    // Only use drag state if there are actual changes to start/end times
                    const hasActualChanges = isBeingDragged &&
                        dragState.currentStart !== null &&
                        dragState.currentEnd !== null && (
                            dragState.currentStart.getTime() !== dragState.originalStart.getTime() ||
                            dragState.currentEnd.getTime() !== dragState.originalEnd.getTime()
                        );

                    const currentEvent = hasActualChanges ? {
                        ...event,
                        start: dragState.currentStart!,
                        end: dragState.currentEnd!
                    } : event;

                    // Recalculate position if being dragged with actual changes
                    const startMinutes = currentEvent.start.getHours() * 60 + currentEvent.start.getMinutes();
                    const endMinutes = currentEvent.end.getHours() * 60 + currentEvent.end.getMinutes();
                    const durationMinutes = endMinutes - startMinutes;
                    const pixelsPerMinute = 80 / 60; // 80px per hour in week view (matches original positioning)
                    const borderOffset = currentEvent.start.getHours(); // 1px per completed hour (same as original positioning)
                    const currentTop = startMinutes * pixelsPerMinute + borderOffset;
                    const currentHeight = Math.max(durationMinutes * pixelsPerMinute, 15); // Minimum 15px height

                    // Get day column dimensions or fallback to calculated values
                    const dayColumn = dayColumnDimensions[dayIndex];
                    let eventLeft: number;
                    let eventWidth: number;

                    if (dayColumn) {
                        // Use actual measured dimensions
                        const padding = 4; // 4px padding from edges
                        const plusButtonSpace = 32; // Reserve 32px for plus button on the right
                        const availableWidth = dayColumn.width - (2 * padding) - plusButtonSpace;

                        if (event.widthPercent && event.widthPercent < 100) {
                            // Overlapping event
                            eventWidth = availableWidth * (event.widthPercent / 100);
                            const leftOffset = event.leftOffsetPercent ?
                                (availableWidth * (event.leftOffsetPercent / 100)) : 0;
                            eventLeft = dayColumn.left + padding + leftOffset;
                        } else {
                            // Full width event (but leave space for plus button)
                            eventWidth = availableWidth;
                            eventLeft = dayColumn.left + padding;
                        }
                    } else {
                        // Don't render events until measurements are ready to prevent left slide-in effect
                        return null;
                    }

                    return (
                        <WeekViewMovableEvent
                            key={`${event.id}-${dayIndex}`}
                            event={event}
                            dayIndex={dayIndex}
                        >
                            {({ listeners, attributes, isDragging }) => {
                                return (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: dayColumn ? `${eventLeft}px` : 0,
                                            width: dayColumn ? `${eventWidth}px` : 0,
                                            top: `${hasActualChanges ? currentTop : event.top}px`,
                                            height: `${hasActualChanges ? currentHeight : event.height}px`,
                                            borderRadius: 1,  // Always use normal rounded corners
                                            background: `linear-gradient(135deg, 
                                                ${getEventColor(event.type)}CC 0%, 
                                                ${getEventColor(event.type)}99 50%,
                                                ${getEventColor(event.type)}BB 100%)`,
                                            border: `1px solid ${getEventColor(event.type)}55`,
                                            cursor: isDragging ? 'grabbing' : 'pointer',
                                            transition: isDragging ? 'none' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                            backdropFilter: 'blur(6px) saturate(1.1)',
                                            animation: 'eventFadeIn 0.2s ease-out',
                                            '@keyframes eventFadeIn': {
                                                '0%': {
                                                    opacity: 0,
                                                    transform: 'scale(0.95)',
                                                },
                                                '100%': {
                                                    opacity: 1,
                                                    transform: 'scale(1)',
                                                },
                                            },
                                            boxShadow: hasActualChanges || isDragging
                                                ? `0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 2px ${getEventColor(event.type)}99`
                                                : `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
                                            zIndex: hasActualChanges || isDragging ? 1000 : 20,
                                            transform: hasActualChanges || isDragging ? 'scale(1.02)' : 'none',
                                            opacity: isDragging ? 0.8 : hasActualChanges ? 0.9 : 1,
                                            pointerEvents: 'auto', // Re-enable pointer events for the event itself
                                            '&:hover': !isDragging ? {
                                                background: `linear-gradient(135deg, 
                                                ${getEventColor(event.type)}DD 0%, 
                                                ${getEventColor(event.type)}AA 50%,
                                                ${getEventColor(event.type)}CC 100%)`,
                                                transform: 'translateY(-1px) scale(1.01)',
                                                boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${getEventColor(event.type)}66`,
                                                zIndex: 30
                                            } : {},
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={() => {
                                            setHoveredEvent(event.id);
                                            setHoveredEventLocal(event.id);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredEvent(null);
                                            setHoveredEventLocal(null);
                                        }}
                                    >
                                        {/* Top drag handle */}
                                        <Box
                                            onMouseDown={(e) => {
                                                e.stopPropagation(); // Prevent event bubbling to parent draggable
                                                handleDragStart(e, event, 'top');
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: '6px',
                                                cursor: 'n-resize',
                                                zIndex: 5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                '&:hover': {
                                                    opacity: 1,
                                                    backgroundColor: 'rgba(255,255,255,0.2)'
                                                },
                                                '&::after': {
                                                    content: '""',
                                                    width: '16px',
                                                    height: '2px',
                                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                                    borderRadius: '1px'
                                                }
                                            }}
                                        />

                                        {/* Event content - this will have the drag listeners */}
                                        <Box
                                            {...listeners}
                                            {...attributes}
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                if (!isBeingDragged && !justFinishedDragging) {
                                                    onEventClick(event);
                                                }
                                            }}
                                            sx={{
                                                p: 0.5,
                                                height: 'calc(100% - 12px)',
                                                position: 'relative',
                                                zIndex: 1,
                                                marginTop: '6px',
                                                cursor: 'grab',
                                                '&:active': {
                                                    cursor: 'grabbing'
                                                }
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    color: '#ffffff',
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                                    lineHeight: 1.2,
                                                    mb: event.height > 30 ? 0.25 : 0,
                                                    pointerEvents: 'none' // Prevent text selection from interfering with drag
                                                }}
                                            >
                                                {event.title}
                                            </Typography>

                                            {event.height > 30 && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontSize: '0.6rem',
                                                        color: 'rgba(255,255,255,0.7)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        pointerEvents: 'none' // Prevent text selection from interfering with drag
                                                    }}
                                                >
                                                    {formatTime(event.start)} - {formatTime(event.end)}
                                                </Typography>
                                            )}

                                            {/* Bottom center continuation indicators for spanning events */}
                                            {event.isSpanningEvent && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: '2px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        opacity: 0.7,
                                                        pointerEvents: 'none',
                                                        fontSize: '8px'
                                                    }}
                                                >
                                                    ↓
                                                </Box>
                                            )}

                                            {/* Delete button - only show on hover for events taller than 40px */}
                                            {event.height > 40 && hoveredEvent === event.id && (
                                                <Box
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onEventDelete) {
                                                            onEventDelete(event);
                                                        }
                                                    }}
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: '4px',
                                                        right: '4px',
                                                        width: '20px',
                                                        height: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        color: 'rgba(255,255,255,0.9)',
                                                        fontWeight: 'normal',
                                                        transition: 'all 0.2s ease',
                                                        zIndex: 100,
                                                        '&:hover': {
                                                            color: 'rgba(255,255,255,1)',
                                                            transform: 'scale(1.1)'
                                                        }
                                                    }}
                                                >
                                                    ×
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Bottom drag handle */}
                                        <Box
                                            onMouseDown={(e) => {
                                                e.stopPropagation(); // Prevent event bubbling to parent draggable
                                                handleDragStart(e, event, 'bottom');
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '6px',
                                                cursor: 's-resize',
                                                zIndex: 5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                '&:hover': {
                                                    opacity: 1,
                                                    backgroundColor: 'rgba(255,255,255,0.2)'
                                                },
                                                '&::after': {
                                                    content: '""',
                                                    width: '16px',
                                                    height: '2px',
                                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                                    borderRadius: '1px'
                                                }
                                            }}
                                        />
                                    </Box>
                                );
                            }}
                        </WeekViewMovableEvent>
                    );
                })
            )}
        </Box>
    );
};

export default WeekEventsOverlay;
