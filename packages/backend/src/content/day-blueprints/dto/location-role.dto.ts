import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDayBlueprintLocationRoleDto {
  @IsString() @MinLength(1) @MaxLength(80) key!: string;
  @IsString() @MinLength(1) @MaxLength(160) display_name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(80) icon?: string;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateDayBlueprintLocationRoleDto extends PartialType(CreateDayBlueprintLocationRoleDto) {}

export class LinkActivityLocationDto {
  @IsInt() day_blueprint_location_role_id!: number;
  @IsOptional() @IsBoolean() is_primary?: boolean;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
}
