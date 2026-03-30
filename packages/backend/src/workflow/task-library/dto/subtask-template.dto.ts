import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubtaskTemplateDto {
    @IsString()
    subtask_key!: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    is_auto_only?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    order_index?: number;
}

export class UpdateSubtaskTemplateDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsBoolean()
    is_auto_only?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    order_index?: number;
}
