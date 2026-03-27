import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateInstanceSceneDto {
  @IsOptional()
  @IsInt()
  scene_template_id?: number;

  @IsString()
  name: string;

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
