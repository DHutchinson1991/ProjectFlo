import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePackageEventDayLocationDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number;

  @IsOptional()
  @IsInt()
  location_id?: number;

  @IsOptional()
  @IsInt()
  package_activity_id?: number | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
