import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DayBlueprintActionEmphasis } from '@prisma/client';

export class CreateDayBlueprintMomentActionDto {
  @IsInt() subject_role_id!: number;
  @IsString() @MinLength(1) @MaxLength(2000) action_text!: string;
  @IsOptional() @IsEnum(DayBlueprintActionEmphasis) emphasis?: DayBlueprintActionEmphasis;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
}

export class UpdateDayBlueprintMomentActionDto extends PartialType(CreateDayBlueprintMomentActionDto) {}
