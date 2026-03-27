import { IsString, IsOptional, IsInt, IsObject, Matches } from 'class-validator';
import { Prisma } from '@prisma/client';

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
  moment_schedules?: Prisma.InputJsonValue;

  @IsOptional()
  @IsObject()
  beat_schedules?: Prisma.InputJsonValue;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
