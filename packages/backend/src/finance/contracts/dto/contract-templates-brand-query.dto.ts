import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ContractTemplatesBrandQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;
}