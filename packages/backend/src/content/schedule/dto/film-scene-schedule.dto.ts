import { IsString, IsOptional, IsInt, IsObject, Matches } from 'class-validator';

export class CreateFilmSceneScheduleDto {
  @IsInt()
  scene_id: number;

  @IsOptional()
  @IsInt()
  event_day_template_id?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduled_start_time must be in HH:MM format' })
  scheduled_start_time?: string;

  @IsOptional()
  @IsInt()
  scheduled_duration_minutes?: number;

  @IsOptional()
  @IsObject()
  moment_schedules?: any; // [{moment_id, start_time, duration_minutes}]

  @IsOptional()
  @IsObject()
  beat_schedules?: any; // [{beat_id, start_time, duration_minutes}]

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class UpdateFilmSceneScheduleDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduled_start_time must be in HH:MM format' })
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
}

export class BulkUpsertFilmSceneScheduleDto {
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
}
