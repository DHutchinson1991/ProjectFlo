import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateInstanceBeatDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  shot_count?: number;

  @IsOptional()
  @IsNumber()
  duration_seconds?: number;
}
