import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ListIwSubmissionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  inquiryId?: number;
}