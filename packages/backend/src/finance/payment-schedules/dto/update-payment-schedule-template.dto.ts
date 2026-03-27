import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateScheduleRuleDto } from './create-schedule-rule.dto';

export class UpdatePaymentScheduleTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleRuleDto)
  rules?: CreateScheduleRuleDto[];
}