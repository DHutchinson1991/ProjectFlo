import { IsString, IsDateString, IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum CalendarEventType {
    PROJECT_ASSIGNMENT = 'PROJECT_ASSIGNMENT',
    ABSENCE = 'ABSENCE',
    HOLIDAY = 'HOLIDAY',
    EXTERNAL_SYNC = 'EXTERNAL_SYNC',
    PERSONAL = 'PERSONAL',
    DISCOVERY_CALL = 'DISCOVERY_CALL',
    CONSULTATION = 'CONSULTATION'
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

export class CreateCalendarEventDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    start_time: string;

    @IsDateString()
    end_time: string;

    @IsOptional()
    @IsBoolean()
    is_all_day?: boolean;

    @IsEnum(CalendarEventType)
    event_type: CalendarEventType;

    @IsInt()
    contributor_id: number;

    @IsOptional()
    @IsInt()
    project_id?: number;

    @IsOptional()
    @IsInt()
    inquiry_id?: number; // For Discovery Calls and Consultations

    @IsOptional()
    @IsEnum(MeetingType)
    meeting_type?: MeetingType; // For calls and meetings

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    meeting_url?: string; // For online meetings

    @IsOptional()
    @IsString()
    outcome_notes?: string; // Post-meeting notes
}

export class UpdateCalendarEventDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    start_time?: string;

    @IsOptional()
    @IsDateString()
    end_time?: string;

    @IsOptional()
    @IsBoolean()
    is_all_day?: boolean;

    @IsOptional()
    @IsEnum(CalendarEventType)
    event_type?: CalendarEventType;

    @IsOptional()
    @IsInt()
    inquiry_id?: number; // For Discovery Calls and Consultations

    @IsOptional()
    @IsEnum(MeetingType)
    meeting_type?: MeetingType; // For calls and meetings

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    meeting_url?: string; // For online meetings

    @IsOptional()
    @IsString()
    outcome_notes?: string; // Post-meeting notes
}

export class CreateEventAttendeeDto {
    @IsInt()
    event_id: number;

    @IsInt()
    user_id: number;

    @IsOptional()
    @IsEnum(ResponseStatus)
    response_status?: ResponseStatus;
}

export class CreateEventReminderDto {
    @IsInt()
    event_id: number;

    @IsEnum(ReminderType)
    reminder_type: ReminderType;

    @IsInt()
    @Min(1)
    minutes_before: number;
}

export class CreateTagDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    color?: string;
}

export class CalendarQueryDto {
    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    contributor_id?: number;

    @IsOptional()
    @IsEnum(CalendarEventType)
    event_type?: CalendarEventType;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    project_id?: number;
}

export class UpdateCalendarSettingsDto {
    @IsOptional()
    @IsString()
    default_view?: string;

    @IsOptional()
    @IsInt()
    week_starts_on?: number;

    @IsOptional()
    @IsString()
    working_hours_start?: string;

    @IsOptional()
    @IsString()
    working_hours_end?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsBoolean()
    email_notifications?: boolean;

    @IsOptional()
    @IsBoolean()
    browser_notifications?: boolean;

    @IsOptional()
    @IsInt()
    default_reminder_minutes?: number;
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
