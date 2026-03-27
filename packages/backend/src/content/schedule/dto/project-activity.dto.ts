import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export { UpdateProjectActivityDto } from './update-project-activity.dto';

export class CreateProjectActivityDto {
  @IsInt()
  project_event_day_id: number;

  @IsOptional()
  @IsInt()
  package_activity_id?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsInt()
  duration_minutes?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

