import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class InitialDayTimingDto {
  @IsInt() @Min(1) day_number!: number;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) default_start_time?: string;
  @IsOptional() @IsInt() @Min(0) default_duration_hours?: number;
}

export class InitialActivityTimingDto {
  @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) default_start_time?: string;
  @IsOptional() @IsInt() @Min(0) default_duration_minutes?: number;
  @IsOptional() @IsInt() @Min(0) duration_min_minutes?: number;
  @IsOptional() @IsInt() @Min(0) duration_max_minutes?: number;
}

export class CreateDayBlueprintDto {
  @IsString() @MinLength(1) @MaxLength(80) key!: string;
  @IsString() @MinLength(1) @MaxLength(160) display_name!: string;
  @IsString() @MinLength(1) @MaxLength(80) event_category!: string;

  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(80) icon?: string;
  @IsOptional() @IsString() @MaxLength(32) color?: string;

  /** Structured tags: region, ceremony_type, style, guest_band, indoor_outdoor, religious_civil. */
  @IsOptional() @IsObject() variant_tags?: Record<string, unknown>;

  @IsOptional() @IsBoolean() is_system_seeded?: boolean;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsInt() @Min(0) order_index?: number;

  @IsOptional() @IsInt() @Min(1) initial_event_days?: number;
  @IsOptional() @IsObject() initial_event_day_roles?: Record<string, string>;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(80, { each: true }) initial_activities?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(7) @IsObject({ each: true }) initial_day_timings?: InitialDayTimingDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsObject({ each: true }) initial_activity_timings?: InitialActivityTimingDto[];
  @IsOptional() @IsString() @MaxLength(80) primary_partner_label?: string;
  @IsOptional() @IsString() @MaxLength(80) second_partner_label?: string;
}

export class UpdateDayBlueprintDto extends PartialType(CreateDayBlueprintDto) {}
