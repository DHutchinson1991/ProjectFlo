import { IsInt, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateClauseDto {
  @IsInt()
  clause_id!: number;

  @IsInt()
  @IsOptional()
  order_index?: number;

  @IsString()
  @IsOptional()
  override_body?: string;
}