import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateEventDayActivityDto {
  @IsString()
  @IsNotEmpty()
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
  @IsNumber()
  default_duration_minutes?: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}
