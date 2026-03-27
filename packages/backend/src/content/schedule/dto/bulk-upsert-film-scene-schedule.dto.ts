import { IsString, IsOptional, IsInt } from 'class-validator';
import { Prisma } from '@prisma/client';

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
  moment_schedules?: Prisma.InputJsonValue | null;

  @IsOptional()
  beat_schedules?: Prisma.InputJsonValue | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
