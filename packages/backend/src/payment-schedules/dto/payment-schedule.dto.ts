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

export class CreatePaymentScheduleTemplateDto {
  @IsNumber()
  brand_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleRuleDto)
  rules: CreateScheduleRuleDto[];
}

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

export class ApplyScheduleToEstimateDto {
  @Type(() => Number)
  @IsNumber()
  template_id: number;

  @IsString()
  booking_date: string;   // ISO date — when booking was confirmed

  @IsString()
  event_date: string;     // ISO date — the wedding/event date

  @Type(() => Number)
  @IsNumber()
  total_amount: number;
}

export class ApplyScheduleToQuoteDto {
  @Type(() => Number)
  @IsNumber()
  template_id: number;

  @IsString()
  booking_date: string;

  @IsString()
  event_date: string;

  @Type(() => Number)
  @IsNumber()
  total_amount: number;
}
