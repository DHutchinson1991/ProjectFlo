import { IsString, IsDateString, IsOptional, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { CalendarEventType, MeetingType } from './calendar-enums.dto';

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
    inquiry_id?: number;

    @IsOptional()
    @IsEnum(MeetingType)
    meeting_type?: MeetingType;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    meeting_url?: string;

    @IsOptional()
    @IsString()
    outcome_notes?: string;

    @IsOptional()
    @IsBoolean()
    is_confirmed?: boolean;
}
