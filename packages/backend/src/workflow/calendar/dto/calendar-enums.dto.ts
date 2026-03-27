export enum CalendarEventType {
    PROJECT_ASSIGNMENT = 'PROJECT_ASSIGNMENT',
    ABSENCE = 'ABSENCE',
    HOLIDAY = 'HOLIDAY',
    EXTERNAL_SYNC = 'EXTERNAL_SYNC',
    PERSONAL = 'PERSONAL',
    DISCOVERY_CALL = 'DISCOVERY_CALL',
    PROPOSAL_REVIEW = 'PROPOSAL_REVIEW'
}

export enum MeetingType {
    ONLINE = 'ONLINE',
    PHONE_CALL = 'PHONE_CALL',
    IN_PERSON = 'IN_PERSON',
    VIDEO_CALL = 'VIDEO_CALL'
}

export enum ResponseStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    TENTATIVE = 'tentative'
}

export enum ReminderType {
    EMAIL = 'email',
    NOTIFICATION = 'notification',
    SMS = 'sms'
}

export interface CalendarSettings {
    id: string;
    user_id: number;
    default_view: string;
    week_starts_on: number;
    working_hours_start: string;
    working_hours_end: string;
    timezone: string;
    email_notifications: boolean;
    browser_notifications: boolean;
    default_reminder_minutes: number;
    created_at: Date;
    updated_at: Date;
}

export interface CalendarStats {
    total_events: number;
    project_events: number;
    personal_events: number;
    holiday_events: number;
    upcoming_events: number;
    past_events: number;
}
