import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateSkillRoleMappingDto {
    @IsString()
    skill_name!: string;

    @IsNumber()
    @Type(() => Number)
    job_role_id!: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    payment_bracket_id?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    brand_id?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    priority?: number;
}

export class UpdateSkillRoleMappingDto {
    @IsOptional()
    @IsString()
    skill_name?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    job_role_id?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    payment_bracket_id?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    priority?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class BulkCreateSkillRoleMappingDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSkillRoleMappingDto)
    mappings!: CreateSkillRoleMappingDto[];
}

export class ResolveSkillRoleDto {
    @IsArray()
    @IsString({ each: true })
    skills_needed!: string[];

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    brand_id?: number;
}

export class SkillRoleMappingQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    brandId?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    jobRoleId?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    paymentBracketId?: number;

    @IsOptional()
    @IsString()
    skill?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    include_inactive?: boolean;
}
