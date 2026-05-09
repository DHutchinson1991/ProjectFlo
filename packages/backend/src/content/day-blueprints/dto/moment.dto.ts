import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DayBlueprintMomentCriticality } from '@prisma/client';

export class CreateDayBlueprintMomentDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsInt() @Min(0) duration_seconds?: number;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
  @IsOptional() @IsBoolean() is_key_moment?: boolean;
  @IsOptional() @IsEnum(DayBlueprintMomentCriticality) criticality?: DayBlueprintMomentCriticality;
  /** Shape: { name, order, duration, required_subjects } booleans. */
  @IsOptional() @IsObject() lock_flags?: Record<string, unknown>;
  @IsOptional() @IsInt() source_event_day_activity_moment_id?: number;
}

export class UpdateDayBlueprintMomentDto extends PartialType(CreateDayBlueprintMomentDto) {}
