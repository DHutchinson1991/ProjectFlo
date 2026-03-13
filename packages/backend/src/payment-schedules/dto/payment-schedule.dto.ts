export class CreateScheduleRuleDto {
  label: string;
  amount_type: 'PERCENT' | 'FIXED';
  amount_value: number;
  trigger_type: 'AFTER_BOOKING' | 'BEFORE_EVENT' | 'AFTER_EVENT' | 'ON_DATE';
  trigger_days?: number;
  order_index?: number;
}

export class CreatePaymentScheduleTemplateDto {
  brand_id: number;
  name: string;
  description?: string;
  is_default?: boolean;
  rules: CreateScheduleRuleDto[];
}

export class UpdatePaymentScheduleTemplateDto {
  name?: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  rules?: CreateScheduleRuleDto[];
}

export class ApplyScheduleToEstimateDto {
  template_id: number;
  booking_date: string;   // ISO date — when booking was confirmed
  event_date: string;     // ISO date — the wedding/event date
  total_amount: number;
}
