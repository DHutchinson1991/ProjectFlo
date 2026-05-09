import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDayBlueprintSpaceSlotDto {
  @IsInt() day_blueprint_location_role_id!: number;
  @IsString() @MinLength(1) @MaxLength(80) key!: string;
  @IsString() @MinLength(1) @MaxLength(160) label!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
}

export class UpdateDayBlueprintSpaceSlotDto extends PartialType(CreateDayBlueprintSpaceSlotDto) {}
