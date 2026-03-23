import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateEventDayActivityDto {
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
  default_start_time?: string;

  @IsOptional()
  @IsInt()
  default_duration_minutes?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class UpdateEventDayActivityDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  default_start_time?: string;

  @IsOptional()
  @IsInt()
  default_duration_minutes?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
