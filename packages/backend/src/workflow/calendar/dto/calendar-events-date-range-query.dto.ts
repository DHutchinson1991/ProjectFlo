import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CalendarEventsDateRangeQueryDto {
  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  crew_member_id?: number;
}
