import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    Schedule as ClockIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { formatTime } from '@/features/workflow/calendar/utils/calendar-date-helpers';
import { getEventColor } from '@/features/workflow/calendar/constants/calendar-config';
import { DraggableEvent } from '../DragAndDrop';
import type { EventWithLayout } from '../../utils/day-view-utils';

interface TimelineEventCardProps {
    event: EventWithLayout;
    dragState: {
        eventId: string;
        currentStart: Date | null;
        currentEnd: Date | null;
        originalStart: Date;
        originalEnd: Date;
    } | null;
    justFinishedDragging: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onDragStart: (e: React.MouseEvent, event: CalendarEvent, direction: 'top' | 'bottom') => void;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
    event, dragState, justFinishedDragging, onEventClick, onDragStart,
}) => {
    const eventContainerWidth = 'calc(100% - 148px)';
    const eventWidth = event.widthPercent !== 100
        ? `calc(${eventContainerWidth} * ${event.widthPercent / 100})`
        : eventContainerWidth;
    const eventLeft = event.leftPercent !== 0
        ? `calc(100px + ${eventContainerWidth} * ${event.leftPercent / 100})`
        : '100px';

    const isBeingDragged = dragState?.eventId === event.id;
    const hasActualChanges = isBeingDragged &&
        dragState.currentStart !== null &&
        dragState.currentEnd !== null &&
        (dragState.currentStart.getTime() !== dragState.originalStart.getTime() ||
         dragState.currentEnd.getTime() !== dragState.originalEnd.getTime());

    const currentEvent = hasActualChanges
        ? { ...event, start: dragState.currentStart!, end: dragState.currentEnd! }
        : event;

    const startMin = new Date(currentEvent.start).getHours() * 60 + new Date(currentEvent.start).getMinutes();
    const endMin = new Date(currentEvent.end).getHours() * 60 + new Date(currentEvent.end).getMinutes();
    const durMin = endMin - startMin;
    const pxPerMin = 80 / 60;
    const currentTop = startMin * pxPerMin;
    const currentHeight = Math.max(durMin * pxPerMin, 20);

    const dragHandleSx = (cursor: string) => ({
        position: 'absolute' as const,
        left: 0, right: 0, height: '8px', cursor, zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity 0.2s ease',
        '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
        '&::after': {
            content: '""', width: '20px', height: '2px',
            backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '1px',
        },
    });

    return (
        <DraggableEvent key={event.id} event={event}>
            <Box
                sx={{
                    position: 'absolute',
                    left: eventLeft, width: eventWidth,
                    top: `${hasActualChanges ? currentTop : event.top}px`,
                    height: `${hasActualChanges ? currentHeight : event.height}px`,
                    borderRadius: 2,
                    background: `linear-gradient(135deg,
                        ${getEventColor(event.type)}CC 0%,
                        ${getEventColor(event.type)}99 50%,
                        ${getEventColor(event.type)}BB 100%)`,
                    border: `1px solid ${getEventColor(event.type)}55`,
                    cursor: isBeingDragged ? 'grabbing' : 'pointer',
                    transition: isBeingDragged ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(6px) saturate(1.1)',
                    boxShadow: hasActualChanges
                        ? `0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 2px ${getEventColor(event.type)}99`
                        : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                    zIndex: hasActualChanges ? 10 : 2,
                    transform: hasActualChanges ? 'scale(1.02)' : 'none',
                    opacity: hasActualChanges ? 0.9 : 1,
                    overflow: 'hidden',
                    '&:hover': !isBeingDragged ? {
                        background: `linear-gradient(135deg,
                            ${getEventColor(event.type)}DD 0%,
                            ${getEventColor(event.type)}AA 50%,
                            ${getEventColor(event.type)}CC 100%)`,
                        transform: 'translateY(-1px) scale(1.01)',
                        boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${getEventColor(event.type)}66`,
                        zIndex: 3,
                    } : {},
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isBeingDragged && !justFinishedDragging) onEventClick(event);
                }}
            >
                {/* Top drag handle */}
                <Box onMouseDown={(e) => onDragStart(e, event, 'top')} sx={{ ...dragHandleSx('n-resize'), top: 0 }} />

                {/* Event content */}
                <Box sx={{ p: 1, height: 'calc(100% - 16px)', position: 'relative', zIndex: 1, marginTop: '8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <ClockIcon sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {formatTime(event.start)}{event.end && ` - ${formatTime(event.end)}`}
                        </Typography>
                    </Box>

                    <Typography variant="body2" sx={{
                        fontSize: '0.9rem', fontWeight: 600, color: '#ffffff',
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '0.01em', lineHeight: 1.3,
                        mb: event.height > 60 ? 0.25 : 0,
                    }}>
                        {event.title}
                    </Typography>

                    {event.description && event.height > 60 && (
                        <Typography variant="body2" sx={{
                            color: 'rgba(255,255,255,0.85)', mb: 0.5,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem',
                        }}>
                            {event.description}
                        </Typography>
                    )}

                    {event.height > 80 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {event.location && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationIcon sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                                        {event.location}
                                    </Typography>
                                </Box>
                            )}
                            {event.assignee && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PersonIcon sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                                        {event.assignee.name}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Bottom drag handle */}
                <Box onMouseDown={(e) => onDragStart(e, event, 'bottom')} sx={{ ...dragHandleSx('s-resize'), bottom: 0 }} />
            </Box>
        </DraggableEvent>
    );
};

export default TimelineEventCard;
