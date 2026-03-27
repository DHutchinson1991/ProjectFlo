import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateInstanceSceneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsNumber()
  shot_count?: number;

  @IsOptional()
  @IsNumber()
  duration_seconds?: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}
