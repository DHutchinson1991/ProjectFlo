import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';

// Extension state for event resizing within week view
export interface WeekViewExtensionState {
    eventId: string;
    direction: 'top' | 'bottom';
    startY: number;
    originalStart: Date;
    originalEnd: Date;
    currentStart: Date | null;
    currentEnd: Date | null;
}

// Hook return type for week view extension operations
export interface WeekViewExtensionOperations {
    extensionState: WeekViewExtensionState | null;
    handleExtensionStart: (e: React.MouseEvent, event: CalendarEvent, direction: 'top' | 'bottom') => void;
    setHoveredEvent: (id: string | null) => void;
    justFinishedExtending: boolean;
}

// Event update function type
export type EventUpdateFunction = (eventId: string, updateData: { start: Date; end: Date }) => Promise<void>;

// Extension operation configuration
export interface ExtensionOperationConfig {
    onEventUpdate?: EventUpdateFunction;
    pixelsPerHour?: number;
    snapToMinutes?: number;
    minDurationMinutes?: number;
}
