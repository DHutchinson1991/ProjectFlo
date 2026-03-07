import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

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

export class UpdateEventTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class LinkEventDayDto {
  @IsInt()
  event_day_template_id!: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class LinkSubjectTypeDto {
  @IsInt()
  subject_type_template_id!: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
