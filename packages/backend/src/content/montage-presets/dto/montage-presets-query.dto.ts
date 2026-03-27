import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class MontagePresetsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;
}
