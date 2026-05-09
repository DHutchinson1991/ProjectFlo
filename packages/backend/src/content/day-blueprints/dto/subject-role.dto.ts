import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDayBlueprintSubjectRoleDto {
  @IsInt() subject_role_id!: number;
  @IsOptional() @IsBoolean() is_primary?: boolean;
  @IsOptional() @IsInt() @Min(0) typical_count?: number;
  @IsOptional() @IsInt() @Min(0) order_index?: number;
}

export class UpdateDayBlueprintSubjectRoleDto extends PartialType(CreateDayBlueprintSubjectRoleDto) {}
