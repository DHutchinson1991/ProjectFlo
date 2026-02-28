import { IsString, IsOptional, IsNumber, IsBoolean, IsJSON, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServicePackageDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Type(() => Number)
  base_price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsOptional()
  @IsObject()
  contents?: Record<string, any>;
}
