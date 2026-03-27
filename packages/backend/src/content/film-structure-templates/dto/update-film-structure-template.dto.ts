import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateTemplateSceneDto } from './update-template-scene.dto';

// Re-export for backwards compatibility
export { UpdateTemplateSceneDto } from './update-template-scene.dto';

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
