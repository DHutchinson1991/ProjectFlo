import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class CalendarStatsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  user_id?: number;
}
