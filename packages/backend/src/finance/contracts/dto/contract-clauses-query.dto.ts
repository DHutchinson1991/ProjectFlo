import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ContractClausesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}