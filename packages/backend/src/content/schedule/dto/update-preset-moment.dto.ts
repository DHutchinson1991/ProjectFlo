import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class UpdatePresetMomentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  duration_seconds?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_key_moment?: boolean;
}
