import { IsString, IsOptional, IsBoolean, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubjectRoleDto } from './create-subject-role.dto';

/**
 * Accepts either a single role (flat fields) or a batch of roles via the
 * `roles` array.  When `roles` is provided, the array entries take precedence
 * and top-level `role_name` / `description` are ignored.
 */
export class CreateSubjectRolesDto {
    @IsOptional()
    @IsString()
    role_name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    is_core?: boolean;

    @IsOptional()
    @IsBoolean()
    is_group?: boolean;

    @IsOptional()
    @IsInt()
    order_index?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSubjectRoleDto)
    roles?: CreateSubjectRoleDto[];
}
