import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateJobRoleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    display_name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
