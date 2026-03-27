import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class CalendarContributorQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  crew_member_id?: number;
}
