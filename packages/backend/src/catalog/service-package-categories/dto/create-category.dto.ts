import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsInt()
  order_index?: number;
}
