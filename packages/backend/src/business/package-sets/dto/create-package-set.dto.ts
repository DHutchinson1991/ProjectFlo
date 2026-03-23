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
  @IsInt()
  event_type_id?: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tier_labels?: string[];
}
