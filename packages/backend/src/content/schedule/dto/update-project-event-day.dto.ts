import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateProjectEventDayDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  start_time?: string | null;

  @IsOptional()
  @IsString()
  end_time?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
