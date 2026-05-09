import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DayBlueprintPlacementFacing, DayBlueprintPlacementPosition } from '@prisma/client';

export class CreateDayBlueprintMomentPlacementDto {
  @IsInt() day_blueprint_space_slot_id!: number;
  @IsInt() subject_role_id!: number;
  @IsOptional() @IsEnum(DayBlueprintPlacementPosition) position_hint?: DayBlueprintPlacementPosition;
  @IsOptional() @IsEnum(DayBlueprintPlacementFacing) facing_hint?: DayBlueprintPlacementFacing;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
}

export class UpdateDayBlueprintMomentPlacementDto extends PartialType(CreateDayBlueprintMomentPlacementDto) {}
