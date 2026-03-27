import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CalendarDiscoveryCallSlotsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(value, 10) : undefined))
  @IsInt()
  brandId?: number;

  @IsDateString()
  date!: string;
}
