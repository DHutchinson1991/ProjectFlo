import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, Min, Max, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ProjectPhase {
    Lead = 'Lead',
    Inquiry = 'Inquiry',
    Booking = 'Booking',
    Creative_Development = 'Creative_Development',
    Pre_Production = 'Pre_Production',
    Production = 'Production',
    Post_Production = 'Post_Production'
}

export enum PricingType {
    Hourly = 'Hourly',
    Fixed = 'Fixed'
}

export enum TaskTriggerType {
    always = 'always',
    per_project = 'per_project',
    per_film = 'per_film',
    per_film_with_music = 'per_film_with_music',
    per_film_with_graphics = 'per_film_with_graphics',
    per_event_day = 'per_event_day',
    per_crew_member = 'per_crew_member',
    per_location = 'per_location',
    per_activity = 'per_activity',
    per_activity_crew = 'per_activity_crew',
    per_film_scene = 'per_film_scene',
}

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
    @IsString()
    notes?: string;

    @IsNumber()
    @Type(() => Number)
    brand_id: number;

    @IsOptional()
    @IsEnum(TaskTriggerType)
    trigger_type?: TaskTriggerType;
}

export class UpdateTaskLibraryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ProjectPhase)
    phase?: ProjectPhase;

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
    default_job_role_id?: number | null;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsEnum(TaskTriggerType)
    trigger_type?: TaskTriggerType;
}

export class TaskLibraryQueryDto {
    @IsOptional()
    @IsEnum(ProjectPhase)
    phase?: ProjectPhase;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    brandId?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsString()
    search?: string;
}

export class TaskOrderUpdateDto {
    @IsNumber()
    @Type(() => Number)
    id: number;

    @IsNumber()
    @Type(() => Number)
    order_index: number;
}

export class BatchUpdateTaskOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TaskOrderUpdateDto)
    tasks: TaskOrderUpdateDto[];

    @IsEnum(ProjectPhase)
    phase: ProjectPhase;

    @IsNumber()
    @Type(() => Number)
    brand_id: number;
}

export class ExecuteAutoGenerationDto {
    @IsNumber()
    @Type(() => Number)
    projectId: number;

    @IsNumber()
    @Type(() => Number)
    packageId: number;

    @IsNumber()
    @Type(() => Number)
    brandId: number;
}
