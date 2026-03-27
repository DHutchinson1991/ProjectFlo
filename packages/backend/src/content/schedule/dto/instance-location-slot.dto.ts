import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export { UpdateInstanceLocationSlotDto } from './update-instance-location-slot.dto';

export class CreateInstanceLocationSlotDto {
  @IsInt()
  project_event_day_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  location_number?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  location_id?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

