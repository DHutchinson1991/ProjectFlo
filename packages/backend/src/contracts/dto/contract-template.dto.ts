import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
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

export class CreateContractTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  payment_schedule_template_id?: number;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateClauseDto)
  @IsOptional()
  clauses?: TemplateClauseDto[];
}

export class UpdateContractTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  payment_schedule_template_id?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateClauseDto)
  @IsOptional()
  clauses?: TemplateClauseDto[];
}

export class ReorderDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];
}
