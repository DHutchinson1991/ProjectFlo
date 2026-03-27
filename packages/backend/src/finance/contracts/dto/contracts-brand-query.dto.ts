import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ContractsBrandQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;
}