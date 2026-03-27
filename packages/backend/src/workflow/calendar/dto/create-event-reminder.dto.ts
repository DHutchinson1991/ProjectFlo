import { IsEnum, IsInt, Min } from 'class-validator';
import { ReminderType } from './calendar-enums.dto';

export class CreateEventReminderDto {
    @IsInt()
    event_id!: number;

    @IsEnum(ReminderType)
    reminder_type!: ReminderType;

    @IsInt()
    @Min(1)
    minutes_before!: number;
}
