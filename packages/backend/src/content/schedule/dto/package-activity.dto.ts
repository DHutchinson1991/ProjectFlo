import { IsString, IsOptional, IsInt } from 'class-validator';

export { UpdatePackageActivityDto } from './update-package-activity.dto';

export class CreatePackageActivityDto {
  @IsInt()
  package_event_day_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsInt()
  duration_minutes?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

