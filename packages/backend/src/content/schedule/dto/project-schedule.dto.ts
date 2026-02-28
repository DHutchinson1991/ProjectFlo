import { IsInt, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

// Project Event Day
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

// Project Film
export class CreateProjectFilmDto {
  @IsInt()
  film_id: number;

  @IsOptional()
  @IsInt()
  package_film_id?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

// Project Film Scene Schedule
export class UpsertProjectFilmSceneScheduleDto {
  @IsInt()
  scene_id: number;

  @IsOptional()
  @IsInt()
  project_event_day_id?: number | null;

  @IsOptional()
  @IsString()
  scheduled_start_time?: string | null;

  @IsOptional()
  @IsInt()
  scheduled_duration_minutes?: number | null;

  @IsOptional()
  moment_schedules?: any;

  @IsOptional()
  beat_schedules?: any;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_locked?: boolean;
}
