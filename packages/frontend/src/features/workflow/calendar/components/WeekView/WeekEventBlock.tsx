import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';
import { getEventColor } from '@/features/workflow/calendar/constants/calendar-config';
import { formatTime } from '@/features/workflow/calendar/utils/calendar-date-helpers';

type ExtendedCalendarEvent = CalendarEvent & {
    top: number;
    height: number;
    leftOffsetPercent?: number;
    widthPercent?: number;
    isSpanningEvent?: boolean;
};

export interface WeekEventBlockProps {
    event: ExtendedCalendarEvent;
    eventLeft: number;
    eventWidth: number;
    currentTop: number;
    currentHeight: number;
    isBeingDragged: boolean;
    hasActualChanges: boolean;
    justFinishedDragging: boolean;
    hoveredEvent: string | null;
    isDragging: boolean;
    listeners?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    onEventClick: (event: CalendarEvent) => void;
    onEventDelete?: (event: CalendarEvent) => void;
    handleDragStart: (e: React.MouseEvent, event: CalendarEvent, handle: 'top' | 'bottom') => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const WeekEventBlock: React.FC<WeekEventBlockProps> = ({
    event,
    eventLeft,
    eventWidth,
    currentTop,
    currentHeight,
    isBeingDragged,
    hasActualChanges,
    justFinishedDragging,
    hoveredEvent,
    isDragging,
    listeners,
    attributes,
    onEventClick,
    onEventDelete,
    handleDragStart,
    onMouseEnter,
    onMouseLeave,
}) => (
    <Box
        sx={{
            position: 'absolute',
            left: `${eventLeft}px`,
            width: `${eventWidth}px`,
            top: `${hasActualChanges ? currentTop : event.top}px`,
            height: `${hasActualChanges ? currentHeight : event.height}px`,
            borderRadius: 1,
            background: `linear-gradient(135deg, ${getEventColor(event.type)}CC 0%, ${getEventColor(event.type)}99 50%, ${getEventColor(event.type)}BB 100%)`,
            border: `1px solid ${getEventColor(event.type)}55`,
            cursor: isDragging ? 'grabbing' : 'pointer',
            transition: isDragging ? 'none' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(6px) saturate(1.1)',
            animation: 'eventFadeIn 0.2s ease-out',
            '@keyframes eventFadeIn': {
                '0%': { opacity: 0, transform: 'scale(0.95)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
            },
            boxShadow: hasActualChanges || isDragging
                ? `0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 2px ${getEventColor(event.type)}99`
                : `0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
            zIndex: hasActualChanges || isDragging ? 1000 : 20,
            transform: hasActualChanges || isDragging ? 'scale(1.02)' : 'none',
            opacity: isDragging ? 0.8 : hasActualChanges ? 0.9 : 1,
            pointerEvents: 'auto',
            '&:hover': !isDragging ? {
                background: `linear-gradient(135deg, ${getEventColor(event.type)}DD 0%, ${getEventColor(event.type)}AA 50%, ${getEventColor(event.type)}CC 100%)`,
                transform: 'translateY(-1px) scale(1.01)',
                boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px ${getEventColor(event.type)}66`,
                zIndex: 30,
            } : {},
            overflow: 'hidden',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
        {/* Top drag handle */}
        <Box
            onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, event, 'top'); }}
            sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
                cursor: 'n-resize', zIndex: 5, display: 'flex', alignItems: 'center',
                justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease',
                '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
                '&::after': { content: '""', width: '16px', height: '2px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '1px' },
            }}
        />

        {/* Draggable event content */}
        <Box
            {...listeners}
            {...attributes}
            onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (!isBeingDragged && !justFinishedDragging) onEventClick(event);
            }}
            sx={{
                p: 0.5, height: 'calc(100% - 12px)', position: 'relative', zIndex: 1,
                marginTop: '6px', cursor: 'grab', '&:active': { cursor: 'grabbing' },
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    fontSize: '0.7rem', fontWeight: 600, color: '#ffffff', display: 'block',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)', lineHeight: 1.2,
                    mb: event.height > 30 ? 0.25 : 0, pointerEvents: 'none',
                }}
            >
                {event.title}
            </Typography>

            {event.height > 30 && (
                <Typography
                    variant="caption"
                    sx={{
                        fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                    }}
                >
                    {formatTime(event.start)} - {formatTime(event.end)}
                </Typography>
            )}

            {event.isSpanningEvent && (
                <Box sx={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', opacity: 0.7, pointerEvents: 'none', fontSize: '8px' }}>
                    ↓
                </Box>
            )}

            {event.height > 40 && hoveredEvent === event.id && (
                <Box
                    onClick={(e) => { e.stopPropagation(); if (onEventDelete) onEventDelete(event); }}
                    sx={{
                        position: 'absolute', bottom: '4px', right: '4px', width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        fontSize: '16px', color: 'rgba(255,255,255,0.9)', fontWeight: 'normal',
                        transition: 'all 0.2s ease', zIndex: 100,
                        '&:hover': { color: 'rgba(255,255,255,1)', transform: 'scale(1.1)' },
                    }}
                >
                    ×
                </Box>
            )}
        </Box>

        {/* Bottom drag handle */}
        <Box
            onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, event, 'bottom'); }}
            sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px',
                cursor: 's-resize', zIndex: 5, display: 'flex', alignItems: 'center',
                justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease',
                '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
                '&::after': { content: '""', width: '16px', height: '2px', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '1px' },
            }}
        />
    </Box>
);

export default WeekEventBlock;
