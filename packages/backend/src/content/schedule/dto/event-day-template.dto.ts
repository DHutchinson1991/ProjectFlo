import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateEventDayDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class UpdateEventDayDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
