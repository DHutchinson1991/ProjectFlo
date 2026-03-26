export interface BackendCalendarEvent {
    id: number;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    is_all_day?: boolean;
    event_type: 'PROJECT_ASSIGNMENT' | 'ABSENCE' | 'HOLIDAY' | 'EXTERNAL_SYNC' | 'PERSONAL' | 'DISCOVERY_CALL' | 'PROPOSAL_REVIEW';
    meeting_type?: 'ONLINE' | 'PHONE_CALL' | 'IN_PERSON' | 'VIDEO_CALL';
    contributor_id: number;
    project_id?: number;
    inquiry_id?: number;
    location?: string;
    meeting_url?: string;
    outcome_notes?: string;
    is_confirmed?: boolean;
    contributor?: {
        id: number;
        contact: { first_name: string; last_name: string; email: string };
    };
    project?: { id: number; name: string };
    inquiry?: {
        id: number;
        contact: { first_name: string; last_name: string; email: string; company_name?: string };
    };
    event_tags?: Array<{
        tag: { id: number; name: string; color: string; description?: string };
    }>;
    event_attendees?: Array<{
        contributor: { id: number; contact: { first_name: string; last_name: string; email: string } };
        status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
    }>;
    event_reminders?: Array<{ id: number; reminder_time: string; method: 'EMAIL' | 'NOTIFICATION' | 'SMS' }>;
}

export interface BackendTag {
    id: number;
    name: string;
    color: string;
    description?: string;
}

export interface BackendCalendarStats {
    total_events: number;
    project_events: number;
    personal_events: number;
    holiday_events: number;
    upcoming_events: number;
    past_events: number;
}

export interface BackendCalendarTask {
    id: number;
    source: 'inquiry' | 'project';
    inquiry_id: number | null;
    project_id: number | null;
    name: string;
    description: string | null;
    phase: string;
    status: string;
    due_date: string | null;
    estimated_hours: number | null;
    completed_at: string | null;
    context_label: string;
    project_name: string | null;
    assignee: { id: number; name: string; email: string } | null;
}

export interface CalendarApiQuery {
    start_date?: string;
    end_date?: string;
    contributor_id?: number;
    event_type?: string;
    limit?: number;
}

export interface BackendContributor {
    id: number;
    contact: { first_name?: string | null; last_name?: string | null; email: string };
}

export interface CalendarEventUpsertRequest {
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    is_all_day?: boolean;
    event_type?: BackendCalendarEvent['event_type'];
    meeting_type?: BackendCalendarEvent['meeting_type'];
    contributor_id?: number;
    project_id?: number;
    inquiry_id?: number;
    location?: string;
    meeting_url?: string;
    outcome_notes?: string;
    is_confirmed?: boolean;
}
