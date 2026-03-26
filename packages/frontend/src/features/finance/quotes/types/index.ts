import type { QuotePaymentMilestone } from '@/features/finance/payment-schedules/types';

export interface QuoteIdentity {
    inquiryId: number;
    quoteId: number;
}

export interface QuoteItem {
    id?: number;
    description: string;
    category?: string;
    unit?: string;
    quantity: number;
    unit_price: number;
}

export interface Quote {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    quote_number: string;
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
    consultation_notes?: string | null;
    notes?: string;
    terms?: string;
    version?: number;
    schedule_template_id?: number | null;
    items: QuoteItem[];
    payment_milestones?: QuotePaymentMilestone[];
    created_at: Date;
    updated_at: Date;
    inquiry?: { id: number; contact_id: number; brand_id: number };
    project?: { id: number; name: string; status: string; created_at: Date; start_date?: Date | null; end_date?: Date | null } | null;
}

export interface CreateQuoteData {
    quote_number: string;
    title?: string;
    issue_date: string;
    expiry_date: string;
    consultation_notes?: string;
    status?: string;
    tax_rate?: number;
    deposit_required?: number;
    payment_method?: string;
    installments?: number;
    notes?: string;
    project_id?: number;
    items: QuoteItem[];
}

export interface UpdateQuoteData {
    quote_number?: string;
    title?: string;
    issue_date?: string;
    expiry_date?: string;
    consultation_notes?: string;
    status?: string;
    is_primary?: boolean;
    tax_rate?: number;
    deposit_required?: number;
    payment_method?: string;
    installments?: number;
    notes?: string;
    project_id?: number;
    items?: QuoteItem[];
}

export type { QuotePaymentMilestone } from '@/features/finance/payment-schedules/types';
