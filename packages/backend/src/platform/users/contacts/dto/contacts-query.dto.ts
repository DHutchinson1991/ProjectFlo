import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class ContactsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;
}