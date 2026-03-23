import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSubjectRoleDto {
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
}
