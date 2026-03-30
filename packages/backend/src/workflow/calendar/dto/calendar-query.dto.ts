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
    @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
    @IsInt()
    crew_id?: number;

    @IsOptional()
    @IsEnum(CalendarEventType)
    event_type?: CalendarEventType;

    @IsOptional()
    @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
    @IsInt()
    project_id?: number;
}
