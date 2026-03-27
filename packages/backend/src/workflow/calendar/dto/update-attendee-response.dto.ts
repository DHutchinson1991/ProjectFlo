import { IsEnum } from 'class-validator';
import { ResponseStatus } from './calendar.dto';

export class UpdateAttendeeResponseDto {
  @IsEnum(ResponseStatus)
  response_status: ResponseStatus;
}