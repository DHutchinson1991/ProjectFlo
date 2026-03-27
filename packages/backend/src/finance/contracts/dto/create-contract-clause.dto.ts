import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';

export class CreateContractClauseDto {
  @IsInt()
  category_id!: number;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

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
