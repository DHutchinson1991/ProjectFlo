export interface Quote {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    quote_number: string;
    status: string;
    issue_date: Date;
    expiry_date: Date;
    total_amount: number;
    consultation_notes?: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface QuoteItem {
    id: number;
    quote_id: number;
    description: string;
    quantity: number;
    unit_price: number;
}
