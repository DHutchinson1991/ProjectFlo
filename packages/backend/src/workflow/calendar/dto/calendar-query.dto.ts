import { IsDateString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { CalendarEventType } from './calendar-enums.dto';

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
    crew_member_id?: number;

    @IsOptional()
    @IsEnum(CalendarEventType)
    event_type?: CalendarEventType;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    project_id?: number;
}
