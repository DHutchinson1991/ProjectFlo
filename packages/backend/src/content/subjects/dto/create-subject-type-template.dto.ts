import { IsString, IsInt, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { SubjectCategory } from '@prisma/client';

export class CreateRoleDto {
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

export class CreateSubjectTypeTemplateDto {
    @IsInt()
    brand_id: number;

    @IsString()
    name: string; // e.g., "Wedding"

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    category: SubjectCategory; // PEOPLE, OBJECTS, LOCATIONS

    @IsArray()
    roles: CreateRoleDto[]; // Array of roles to create with this template
}
