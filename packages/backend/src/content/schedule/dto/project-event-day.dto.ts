import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export { UpdateProjectEventDayDto } from './update-project-event-day.dto';

export class CreateProjectEventDayDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number;

  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

