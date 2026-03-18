import { IsInt, IsOptional, IsString } from 'class-validator';

// Package Film (join table)
export class CreatePackageFilmDto {
  @IsInt()
  film_id: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePackageFilmDto {
  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Package Film Scene Schedule (overrides)
export class UpsertPackageFilmSceneScheduleDto {
  @IsInt()
  scene_id: number;

  @IsOptional()
  @IsInt()
  event_day_template_id?: number | null;

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
  @IsInt()
  package_activity_id?: number | null;
}
