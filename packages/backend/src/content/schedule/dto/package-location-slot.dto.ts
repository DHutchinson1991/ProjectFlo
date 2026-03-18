import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreatePackageLocationSlotDto {
  @IsInt()
  event_day_template_id!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  location_number?: number; // If omitted, auto-assigns next available
}

export class UpdatePackageLocationSlotDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  location_number?: number;
}
