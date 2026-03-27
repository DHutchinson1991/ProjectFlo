import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PaymentBracketsByRoleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;
}