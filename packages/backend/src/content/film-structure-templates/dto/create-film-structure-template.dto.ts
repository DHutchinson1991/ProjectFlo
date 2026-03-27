import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTemplateSceneDto } from './create-template-scene.dto';

// Re-export for backwards compatibility
export { CreateTemplateSceneDto } from './create-template-scene.dto';

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
