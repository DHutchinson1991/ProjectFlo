import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class CalendarUpcomingEventsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  crew_id?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  limit?: number;
}
