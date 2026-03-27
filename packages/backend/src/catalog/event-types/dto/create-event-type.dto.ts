import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateEventTypeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  default_duration_hours?: number;

  @IsOptional()
  @IsString()
  default_start_time?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  typical_guest_count?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}
