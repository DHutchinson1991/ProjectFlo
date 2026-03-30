import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertBrandFinanceSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  onsite_half_day_max_hours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  onsite_full_day_max_hours?: number;
}
