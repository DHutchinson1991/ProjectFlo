import { IsInt, IsOptional, Max, Min } from 'class-validator';

export { UpdatePackageLocationSlotDto } from './update-package-location-slot.dto';

export class CreatePackageLocationSlotDto {
  @IsInt()
  event_day_template_id!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  location_number?: number; // If omitted, auto-assigns next available
}

