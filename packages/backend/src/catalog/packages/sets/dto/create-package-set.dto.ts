import { IsString, IsOptional, IsNumber, IsInt, IsArray } from 'class-validator';

export class CreatePackageSetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  event_category?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tier_labels?: string[];
}
