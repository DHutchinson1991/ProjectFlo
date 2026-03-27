import { IsInt, IsOptional, IsString } from 'class-validator';

export { UpdatePackageEventDayLocationDto } from './update-package-event-day-location.dto';

export class CreatePackageEventDayLocationDto {
  @IsInt()
  event_day_template_id!: number;

  @IsInt()
  location_id!: number;

  @IsOptional()
  @IsInt()
  package_activity_id?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

