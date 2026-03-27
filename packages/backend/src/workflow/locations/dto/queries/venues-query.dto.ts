import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class VenuesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;
}
