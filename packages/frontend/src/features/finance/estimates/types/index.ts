import type { EstimatePaymentMilestone } from '@/features/finance/payment-schedules/types';

export interface EstimateIdentity {
    inquiryId: number;
    estimateId: number;
}

export interface EstimateItem {
    id?: number;
    category?: string;
    description: string;
    service_date?: Date | null;
    start_time?: string;
    end_time?: string;
    quantity: number;
    unit?: string;
    unit_price: number;
}

export interface Estimate {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    estimate_number: string;
    title?: string;
    status: string; // "Draft", "Sent", "Accepted", "Declined"
    issue_date: Date;
    expiry_date: Date;
    total_amount: number;
    total_with_tax?: number;
    tax_rate?: number;
    currency?: string;
    deposit_required?: number;
    payment_method?: string;
    installments?: number;
    is_primary?: boolean;
    version?: number;
    is_stale?: boolean;
    notes?: string;
    terms?: string;
    schedule_template_id?: number | null;
    items: EstimateItem[];
    payment_milestones?: EstimatePaymentMilestone[];
    created_at: Date;
    updated_at: Date;
    inquiry?: { id: number; contact_id: number; brand_id: number };
    project?: { id: number; name: string; status: string; created_at: Date; start_date?: Date | null; end_date?: Date | null } | null;
}

export interface EstimateSnapshot {
    id: number;
    estimate_id: number;
    version_number: number;
    snapshotted_at: Date;
    total_amount: number;
    items_snapshot: Array<{
        description: string;
        category?: string | null;
        quantity: number;
        unit?: string | null;
        unit_price: number;
    }>;
    label?: string | null;
}

export interface CreateEstimateData {
    estimate_number?: string;
    title?: string;
    issue_date: string;
    expiry_date: string;
    status?: string;
    tax_rate?: number;
    deposit_required?: number;
    payment_method?: string;
    installments?: number;
    notes?: string;
    terms?: string;
    project_id?: number;
    items: EstimateItem[];
}

export interface UpdateEstimateData {
    estimate_number?: string;
    title?: string;
    issue_date?: string;
    expiry_date?: string;
    status?: string;
    is_primary?: boolean;
    tax_rate?: number;
    deposit_required?: number;
    payment_method?: string;
    installments?: number;
    notes?: string;
    terms?: string;
    project_id?: number;
    items?: EstimateItem[];
}

export type { EstimatePaymentMilestone } from '@/features/finance/payment-schedules/types';
