import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreatePresetMomentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration_seconds?: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_key_moment?: boolean;
}
