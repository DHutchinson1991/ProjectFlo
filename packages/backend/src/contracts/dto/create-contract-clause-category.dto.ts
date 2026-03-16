import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateContractClauseCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  country_code?: string;
}

export class UpdateContractClauseCategoryDto {
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
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
