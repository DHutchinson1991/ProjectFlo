import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class UpdateProjectActivityDto {
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

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_locked?: boolean;
}
