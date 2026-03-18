import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTemplateSceneDto {
    @IsNumber()
    @IsOptional()
    id?: number; // existing scene ID for updates

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    mode?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    suggested_duration_seconds?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateFilmStructureTemplateDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    film_type?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => UpdateTemplateSceneDto)
    scenes?: UpdateTemplateSceneDto[];
}
