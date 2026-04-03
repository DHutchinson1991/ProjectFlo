import { EventType, MeetingType } from '@/features/workflow/calendar';

export interface MeetingEvent {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    event_type: EventType;
    meeting_type?: MeetingType;
    meeting_url?: string;
    location?: string;
    description?: string;
    outcome_notes?: string;
    assignee_id?: number;
    inquiry_id?: number;
}

export interface MeetingFormData {
    title: string;
    start_time: string;
    end_time: string;
    event_type: EventType;
    meeting_type?: MeetingType;
    meeting_url?: string;
    location?: string;
    description?: string;
    assignee_id?: number;
}

export interface MeetingSchedulerProps {
    meetings: MeetingEvent[];
    onScheduleMeeting: (meetingData: MeetingFormData) => Promise<void>;
    onUpdateMeeting: (meetingId: number, meetingData: Partial<MeetingFormData>) => Promise<void>;
    onDeleteMeeting: (meetingId: number) => Promise<void>;
    isLoading?: boolean;
    eventType: EventType;
    defaultDurationMinutes?: number;
    defaultTitle?: string;
    defaultDescription?: string;
    defaultMeetingUrl?: string;
    accentColor?: string;
    scheduleLabel?: string;
    emptyMessage?: string;
    clientPreferredDate?: string;
    clientPreferredTime?: string;
    clientPreferredMethod?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

