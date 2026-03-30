import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class CalendarCrewQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  crew_id?: number;
}