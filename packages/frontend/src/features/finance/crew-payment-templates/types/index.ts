import type { PaymentAmountType } from '@/features/finance/payment-schedules/types';

export type CrewPaymentTriggerType =
    | 'ON_BOOKING'
    | 'ON_SHOOT_DAY'
    | 'ON_COMPLETION'
    | 'AFTER_DELIVERY'
    | 'BEFORE_EVENT'
    | 'AFTER_EVENT'
    | 'ON_FIRST_EDIT'
    | 'AFTER_ROUGH_CUT'
    | 'NET_DAYS'
    | 'ON_TASK_COMPLETE'
    | 'RECURRING';

export type CrewPaymentRoleType = 'on_site' | 'off_site';
export type CrewPaymentTerms = 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_14' | 'NET_30' | 'NET_60';
export type CrewPaymentFrequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY';

export interface CrewPaymentRule {
    id?: number;
    template_id?: number;
    label: string;
    amount_type: PaymentAmountType;
    amount_value: number;
    trigger_type: CrewPaymentTriggerType;
    trigger_days?: number | null;
    task_library_id?: number | null;
    frequency?: CrewPaymentFrequency | null;
    order_index?: number;
}

export interface CrewPaymentTemplate {
    id: number;
    brand_id: number;
    name: string;
    description?: string;
    role_type: CrewPaymentRoleType;
    payment_terms?: CrewPaymentTerms | null;
    is_default: boolean;
    is_active: boolean;
    rules: CrewPaymentRule[];
    created_at: Date;
    updated_at: Date;
}

export interface CreateCrewPaymentTemplateData {
    name: string;
    description?: string;
    role_type: CrewPaymentRoleType;
    payment_terms?: CrewPaymentTerms;
    is_default?: boolean;
    rules: Omit<CrewPaymentRule, 'id' | 'template_id'>[];
}

export interface UpdateCrewPaymentTemplateData {
    name?: string;
    description?: string;
    role_type?: CrewPaymentRoleType;
    payment_terms?: CrewPaymentTerms;
    is_default?: boolean;
    is_active?: boolean;
    rules?: Omit<CrewPaymentRule, 'id' | 'template_id'>[];
}

export type { PaymentAmountType } from '@/features/finance/payment-schedules/types';
