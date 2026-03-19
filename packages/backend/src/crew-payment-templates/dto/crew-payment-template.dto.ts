import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsIn, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCrewPaymentRuleDto {
  @IsString() @IsNotEmpty()
  label!: string;

  @IsIn(['PERCENT', 'FIXED'])
  amount_type!: 'PERCENT' | 'FIXED';

  @IsNumber()
  amount_value!: number;

  @IsIn(['ON_BOOKING', 'ON_SHOOT_DAY', 'ON_COMPLETION', 'AFTER_DELIVERY', 'BEFORE_EVENT', 'AFTER_EVENT', 'ON_FIRST_EDIT', 'AFTER_ROUGH_CUT', 'NET_DAYS', 'ON_TASK_COMPLETE', 'RECURRING'])
  trigger_type!: 'ON_BOOKING' | 'ON_SHOOT_DAY' | 'ON_COMPLETION' | 'AFTER_DELIVERY' | 'BEFORE_EVENT' | 'AFTER_EVENT' | 'ON_FIRST_EDIT' | 'AFTER_ROUGH_CUT' | 'NET_DAYS' | 'ON_TASK_COMPLETE' | 'RECURRING';

  @IsOptional() @IsInt()
  trigger_days?: number;

  @IsOptional() @IsInt()
  task_library_id?: number;

  @IsOptional() @IsIn(['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'])
  frequency?: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';

  @IsOptional() @IsInt()
  order_index?: number;
}

export class CreateCrewPaymentTemplateDto {
  @IsOptional() @IsInt()
  brand_id!: number;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsIn(['on_site', 'off_site'])
  role_type!: 'on_site' | 'off_site';

  @IsOptional() @IsIn(['DUE_ON_RECEIPT', 'NET_7', 'NET_14', 'NET_30', 'NET_60'])
  payment_terms?: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_14' | 'NET_30' | 'NET_60';

  @IsOptional() @IsBoolean()
  is_default?: boolean;

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCrewPaymentRuleDto)
  rules!: CreateCrewPaymentRuleDto[];
}

export class UpdateCrewPaymentTemplateDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsIn(['on_site', 'off_site'])
  role_type?: 'on_site' | 'off_site';

  @IsOptional() @IsIn(['DUE_ON_RECEIPT', 'NET_7', 'NET_14', 'NET_30', 'NET_60'])
  payment_terms?: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_14' | 'NET_30' | 'NET_60';

  @IsOptional() @IsBoolean()
  is_default?: boolean;

  @IsOptional() @IsBoolean()
  is_active?: boolean;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCrewPaymentRuleDto)
  rules?: CreateCrewPaymentRuleDto[];
}
