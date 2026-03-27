import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
