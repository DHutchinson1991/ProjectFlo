import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DayBlueprintPlacementFacing, DayBlueprintPlacementPosition } from '@prisma/client';

export class CreateDayBlueprintMomentPlacementDto {
  @IsInt() day_blueprint_space_slot_id!: number;
  @IsInt() subject_role_id!: number;
  @IsOptional() @IsEnum(DayBlueprintPlacementPosition) position_hint?: DayBlueprintPlacementPosition;
  @IsOptional() @IsEnum(DayBlueprintPlacementFacing) facing_hint?: DayBlueprintPlacementFacing;
  /** Placement machine tokens (per-copy coords/seats) can exceed 1k for large typical_count roles. DB column is TEXT. */
  @IsOptional() @IsString() @MaxLength(65535) notes?: string;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
}

export class UpdateDayBlueprintMomentPlacementDto extends PartialType(CreateDayBlueprintMomentPlacementDto) {}
