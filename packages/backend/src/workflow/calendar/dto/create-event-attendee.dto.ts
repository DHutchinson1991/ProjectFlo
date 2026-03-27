import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { ResponseStatus } from './calendar-enums.dto';

export class CreateEventAttendeeDto {
    @IsInt()
    event_id!: number;

    @IsInt()
    user_id!: number;

    @IsOptional()
    @IsEnum(ResponseStatus)
    response_status?: ResponseStatus;
}
