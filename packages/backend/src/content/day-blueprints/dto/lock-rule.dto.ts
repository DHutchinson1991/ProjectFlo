import { IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DayBlueprintLockScope } from '@prisma/client';

export class CreateDayBlueprintLockRuleDto {
  @IsEnum(DayBlueprintLockScope) scope!: DayBlueprintLockScope;
  @IsOptional() @IsInt() target_id?: number;
  @IsString() @MinLength(1) @MaxLength(80) rule_key!: string;
  @IsOptional() @IsObject() rule_value?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class UpdateDayBlueprintLockRuleDto extends PartialType(CreateDayBlueprintLockRuleDto) {}
