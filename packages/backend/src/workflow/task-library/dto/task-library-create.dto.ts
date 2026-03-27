import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectPhase, PricingType, TaskTriggerType } from './task-library-enums.dto';

export class CreateTaskLibraryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(ProjectPhase)
    phase: ProjectPhase;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    effort_hours?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    recorded_hours?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills_needed?: string[];

    @IsOptional()
    @IsEnum(PricingType)
    pricing_type?: PricingType;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    fixed_price?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    hourly_rate?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    @Type(() => Number)
    complexity_score?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    default_job_role_id?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    default_contributor_id?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsNumber()
    @Type(() => Number)
    brand_id: number;

    @IsOptional()
    @IsEnum(TaskTriggerType)
    trigger_type?: TaskTriggerType;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    due_date_offset_days?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    parent_task_id?: number;

    @IsOptional()
    @IsBoolean()
    is_task_group?: boolean;
}
