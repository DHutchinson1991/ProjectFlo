import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTemplateSceneDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    mode?: string; // SceneType enum value

    @IsNumber()
    @IsOptional()
    @Min(1)
    suggested_duration_seconds?: number;

    @IsNumber()
    @Min(0)
    order_index: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateFilmStructureTemplateDto {
    @IsNumber()
    @IsOptional()
    brand_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    film_type?: string; // FilmType enum value

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateTemplateSceneDto)
    scenes?: CreateTemplateSceneDto[];
}
