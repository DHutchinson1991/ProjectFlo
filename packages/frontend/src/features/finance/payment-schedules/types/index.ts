export interface PaymentScheduleTemplateIdentity {
    templateId: number;
}

export type PaymentTriggerType = 'AFTER_BOOKING' | 'BEFORE_EVENT' | 'AFTER_EVENT' | 'ON_DATE';
export type PaymentAmountType = 'PERCENT' | 'FIXED';
export type MilestoneStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface PaymentScheduleRule {
    id?: number;
    template_id?: number;
    label: string;
    amount_type: PaymentAmountType;
    amount_value: number;
    trigger_type: PaymentTriggerType;
    trigger_days?: number | null;
    order_index?: number;
}

export interface PaymentScheduleTemplate {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    is_default: boolean;
    is_active: boolean;
    rules: PaymentScheduleRule[];
    created_at: Date;
    updated_at: Date;
}

export interface EstimatePaymentMilestone {
    id: number;
    estimate_id: number;
    label: string;
    amount: number;
    due_date: string;
    status: MilestoneStatus;
    notes?: string;
    order_index: number;
    created_at: Date;
    updated_at: Date;
}

export interface QuotePaymentMilestone {
    id: number;
    quote_id: number;
    label: string;
    amount: number;
    due_date: string;
    status: MilestoneStatus;
    notes?: string;
    order_index: number;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePaymentScheduleTemplateData {
    name: string;
    description?: string;
    is_default?: boolean;
    rules: PaymentScheduleRule[];
}

export interface UpdatePaymentScheduleTemplateData {
    name?: string;
    description?: string;
    is_default?: boolean;
    is_active?: boolean;
    rules?: PaymentScheduleRule[];
}

export interface ApplyScheduleData {
    template_id: number;
    booking_date: string;
    event_date: string;
    total_amount: number;
}

/** @deprecated Use ApplyScheduleData instead */
export type ApplyScheduleToEstimateData = ApplyScheduleData;
/** @deprecated Use ApplyScheduleData instead */
export type ApplyScheduleToQuoteData = ApplyScheduleData;
