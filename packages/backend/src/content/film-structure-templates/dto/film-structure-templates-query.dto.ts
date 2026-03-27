import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class FilmStructureTemplatesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsString()
  filmType?: string;
}
