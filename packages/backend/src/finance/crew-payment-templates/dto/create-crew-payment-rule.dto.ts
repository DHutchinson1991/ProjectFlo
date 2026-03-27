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