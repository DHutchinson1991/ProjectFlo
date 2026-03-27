import { IsInt, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpsertProjectFilmSceneScheduleDto {
  @IsInt()
  scene_id: number;

  @IsOptional()
  @IsInt()
  project_activity_id?: number | null;

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
  moment_schedules?: Prisma.InputJsonValue | null;

  @IsOptional()
  beat_schedules?: Prisma.InputJsonValue | null;

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
