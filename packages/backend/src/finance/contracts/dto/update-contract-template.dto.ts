import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateClauseDto } from './template-clause.dto';

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