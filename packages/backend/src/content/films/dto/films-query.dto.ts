import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class FilmsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsString()
  activeOnly?: string;
}
