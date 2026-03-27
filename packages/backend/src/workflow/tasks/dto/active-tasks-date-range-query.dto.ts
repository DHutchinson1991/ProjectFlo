import { IsDateString } from 'class-validator';

export class ActiveTasksDateRangeQueryDto {
  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}