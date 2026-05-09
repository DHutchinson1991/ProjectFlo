import { IsInt, IsIn, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateShotPreviewDto {
  @IsInt()
  @Type(() => Number)
  camera_assignment_id: number;

  @IsInt()
  @Type(() => Number)
  film_id: number;

  @IsOptional()
  @IsString()
  @IsIn(['package', 'project'])
  source_type?: string = 'package';

  @IsOptional()
  @IsString()
  location_hint?: string;
}
