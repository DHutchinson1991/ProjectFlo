import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';

export class UpdateContractClauseDto {
  @IsOptional()
  @IsInt()
  category_id?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsIn(['STANDARD', 'EXTRA'])
  clause_type?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  order_index?: number;
}