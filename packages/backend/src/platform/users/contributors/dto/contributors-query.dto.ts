import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ContributorsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;
}