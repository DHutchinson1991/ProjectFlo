import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PreviewAutoGenerationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  inquiryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;
}