import { CalendarEvent } from '@/features/workflow/calendar/types/calendar-types';

export interface DragData {
    event: CalendarEvent;
    originalDate: Date;
    originalStartTime: Date;
    originalEndTime: Date;
}

export interface DropData {
    date: Date;
    time: number; // hour as number (0-23)
    timeSlot: string; // formatted time string for identification
}

export interface TimeSlotDropData extends DropData {
    type: 'timeSlot';
}

export interface DragOverData {
    isOver: boolean;
    targetDate?: Date;
    targetTime?: number;
}

export interface DragEndEvent {
    active: {
        id: string;
        data: {
            current: DragData;
        };
    };
    over: {
        id: string;
        data: {
            current: TimeSlotDropData;
        };
    } | null;
}
