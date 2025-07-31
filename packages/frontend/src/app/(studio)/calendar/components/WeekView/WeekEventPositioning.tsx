import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarEvent } from '../../types';
import { WeekViewMovableEvent } from './WeekViewMovableEvent';
import { formatTime } from '../../utils';

// Extended event type with positioning properties
type ExtendedCalendarEvent = CalendarEvent & {
    top: number;
    height: number;
    leftOffsetPercent?: number;
    widthPercent?: number;
};

interface WeekEventPositioningProps {
    event: ExtendedCalendarEvent;
    dayIndex: number;
    extensionState?: {
        eventId: string;
        currentStart: Date | null;
        currentEnd: Date | null;
        originalStart: Date;
        originalEnd: Date;
    } | null;
    isBeingExtended: boolean;
    justFinishedExtending: boolean;
    onEventClick: (event: CalendarEvent) => void;
    handleExtensionStart: (e: React.MouseEvent, event: CalendarEvent, handle: 'top' | 'bottom') => void;
    getEventColor: (type: string) => string;
    setHoveredEvent: (id: string | null) => void;
}

const WeekEventPositioning: React.FC<WeekEventPositioningProps> = ({
    event,
    dayIndex,
    extensionState,
    isBeingExtended,
    justFinishedExtending,
    onEventClick,
    handleExtensionStart,
    getEventColor,
    setHoveredEvent
}) => {
    // Calculate if there are actual changes during extension
    const hasActualChanges = isBeingExtended &&
        extensionState?.currentStart !== null &&
        extensionState?.currentEnd !== null &&
        extensionState && (
            extensionState.currentStart!.getTime() !== extensionState.originalStart.getTime() ||
            extensionState.currentEnd!.getTime() !== extensionState.originalEnd.getTime()
        );

    const currentEvent = hasActualChanges ? {
        ...event,
        start: extensionState!.currentStart!,
        end: extensionState!.currentEnd!
    } : event;

    // WEEK VIEW POSITIONING CALCULATIONS
    // Week view uses 80px per hour with 1px border offsets
    const startMinutes = currentEvent.start.getHours() * 60 + currentEvent.start.getMinutes();
    const endMinutes = currentEvent.end.getHours() * 60 + currentEvent.end.getMinutes();
    const durationMinutes = endMinutes - startMinutes;

    // 80px per hour to match WeekView time slot height
    const pixelsPerMinute = 80 / 60;

    // Account for borders between hour rows (1px border-bottom on each hour row except last)
    const borderOffset = currentEvent.start.getHours();

    // Calculate final position
    const currentTop = startMinutes * pixelsPerMinute + borderOffset;
    const currentHeight = Math.max(durationMinutes * pixelsPerMinute, 15); // Minimum 15px height

    return (
        <WeekViewMovableEvent key={`${event.id}-${dayIndex}`} event={event} dayIndex={dayIndex}>
            {({ listeners, attributes }) => (
                <Box
                    sx={{
                        position: 'absolute',
                        // Horizontal positioning: start after 100px hour label, then divide remaining space by 7 days
                        left: `calc(100px + ${dayIndex} * (100% - 100px) / 7 + ${(event.leftOffsetPercent || 0) / 100} * ((100% - 100px) / 7 - 15px))`,
                        width: event.widthPercent && event.widthPercent < 100
                            ? `calc(((100% - 100px) / 7 - 15px) * ${event.widthPercent / 100})`
                            : `calc((100% - 100px) / 7 - 15px)`,
                        // Vertical positioning: use calculated top and height
                        top: `${hasActualChanges ? currentTop : event.top}px`,
                        height: `${hasActualChanges ? currentHeight : event.height}px`,
                        borderRadius: 1,
                        background: `linear-gradient(135deg, 
                            ${getEventColor(event.type)}CC 0%, 
                            ${getEventColor(event.type)}99 50%,
                            ${getEventColor(event.type)}BB 100%)`,
                        border: `1px solid ${getEventColor(event.type)}55`,
                        cursor: isBeingExtended ? 'grabbing' : 'pointer',
                        transition: isBeingExtended ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(6px) saturate(1.1)',
                        boxShadow: hasActualChanges
                            ? `0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 2px ${getEventColor(event.type)}99`
                            : `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
                        zIndex: hasActualChanges ? 10 : 2,
                        transform: hasActualChanges ? 'scale(1.02)' : 'none',
                        opacity: hasActualChanges ? 0.9 : 1,
                        '&:hover': !isBeingExtended ? {
                            background: `linear-gradient(135deg, 
                            ${getEventColor(event.type)}DD 0%, 
                            ${getEventColor(event.type)}AA 50%,
                            ${getEventColor(event.type)}CC 100%)`,
                            transform: 'translateY(-1px) scale(1.01)',
                            boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${getEventColor(event.type)}66`,
                            zIndex: 3
                        } : {},
                        overflow: 'hidden'
                    }}
                    onMouseEnter={() => setHoveredEvent(event.id)}
                    onMouseLeave={() => setHoveredEvent(null)}
                >
                    {/* Top drag handle */}
                    <Box
                        onMouseDown={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to parent draggable
                            handleExtensionStart(e, event, 'top');
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
                            if (!isBeingExtended && !justFinishedExtending) {
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
                    </Box>

                    {/* Bottom drag handle */}
                    <Box
                        onMouseDown={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to parent draggable
                            handleExtensionStart(e, event, 'bottom');
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
            )}
        </WeekViewMovableEvent>
    );
};

export default WeekEventPositioning;
