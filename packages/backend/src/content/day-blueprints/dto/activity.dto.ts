import { IsEnum, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DayBlueprintActivityCriticality } from '@prisma/client';

export class CreateDayBlueprintActivityDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(80) icon?: string;
  @IsOptional() @IsString() @MaxLength(32) color?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) default_start_time?: string;
  @IsOptional() @IsInt() @Min(0) default_duration_minutes?: number;
  @IsOptional() @IsInt() @Min(0) duration_min_minutes?: number;
  @IsOptional() @IsInt() @Min(0) duration_max_minutes?: number;
  /** Explicit override for AI moment count. Leave undefined/null to defer to
   *  the brand's density library. Capped at 24 to keep prefixItems tractable. */
  @IsOptional() @IsInt() @Min(1) @Max(24) target_moment_count?: number | null;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
  @IsOptional() @IsEnum(DayBlueprintActivityCriticality) criticality?: DayBlueprintActivityCriticality;
  /** Shape: { name: bool, order: bool, duration: bool }. */
  @IsOptional() @IsObject() lock_flags?: Record<string, unknown>;
  @IsOptional() @IsInt() source_event_day_activity_id?: number;
}

export class UpdateDayBlueprintActivityDto extends PartialType(CreateDayBlueprintActivityDto) {}
