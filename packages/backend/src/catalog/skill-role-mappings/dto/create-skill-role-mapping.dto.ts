import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
