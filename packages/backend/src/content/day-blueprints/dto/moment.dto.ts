import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
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
  /**
   * When set, copies actions and placements from this moment (same activity)
   * onto the new row. Only allowed for blueprints with `variant_tags.blank_authoring === true`,
   * and the source must be the direct predecessor by `order_index`.
   */
  @IsOptional() @IsInt() @Min(1) inherit_from_moment_id?: number;
}

export class UpdateDayBlueprintMomentDto extends PartialType(
  OmitType(CreateDayBlueprintMomentDto, ['inherit_from_moment_id'] as const),
) {}
