import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleRuleDto {
  @IsString()
  label: string;

  @IsIn(['PERCENT', 'FIXED'])
  amount_type: 'PERCENT' | 'FIXED';

  @IsNumber()
  amount_value: number;

  @IsIn(['AFTER_BOOKING', 'BEFORE_EVENT', 'AFTER_EVENT', 'ON_DATE'])
  trigger_type: 'AFTER_BOOKING' | 'BEFORE_EVENT' | 'AFTER_EVENT' | 'ON_DATE';

  @IsOptional()
  @IsNumber()
  trigger_days?: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}