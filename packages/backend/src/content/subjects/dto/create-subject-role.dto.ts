import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

// Re-export for backwards compatibility
export { CreateSubjectRolesDto } from './create-subject-roles.dto';

export class CreateSubjectRoleDto {
    @IsString()
    role_name: string;

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
}
