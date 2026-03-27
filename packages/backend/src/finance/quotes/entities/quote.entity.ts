import { Prisma } from '@prisma/client';

export interface Quote {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    quote_number: string;
    status: string;
    issue_date: Date;
    expiry_date: Date;
    total_amount: number;
    total_with_tax?: number;
    currency?: string;
    consultation_notes?: string | null;
    created_at: Date;
    updated_at: Date;

    // New Fields
    title: string;
    is_primary: boolean;
    tax_rate: Prisma.Decimal | number;
    deposit_required?: Prisma.Decimal | number | null;
    notes?: string | null;
    terms?: string | null;
    payment_method?: string | null;
    installments?: number | null;
}

export interface QuoteItem {
    id: number;
    quote_id: number;
    description: string;
    quantity: number;
    unit_price: number;
}
