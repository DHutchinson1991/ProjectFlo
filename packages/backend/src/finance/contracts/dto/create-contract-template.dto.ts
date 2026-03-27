import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateClauseDto } from './template-clause.dto';

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