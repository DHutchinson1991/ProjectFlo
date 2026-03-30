import { IsString, IsDateString, IsOptional, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { CalendarEventType, MeetingType } from './calendar-enums.dto';

export class CreateCalendarEventDto {
    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    start_time!: string;

    @IsDateString()
    end_time!: string;

    @IsOptional()
    @IsBoolean()
    is_all_day?: boolean;

    @IsEnum(CalendarEventType)
    event_type!: CalendarEventType;

    @IsInt()
    crew_id!: number;

    @IsOptional()
    @IsInt()
    project_id?: number;

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
