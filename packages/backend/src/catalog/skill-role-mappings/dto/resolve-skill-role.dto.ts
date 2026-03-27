import { IsArray, IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ResolveSkillRoleDto {
    @IsArray()
    @IsString({ each: true })
    skills_needed!: string[];

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    brand_id?: number;
}
