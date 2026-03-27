export interface Invoice {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    invoice_number: string;
    status: string;
    issue_date: Date;
    due_date: Date;
    amount: number;
    amount_paid?: number | null;
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description: string;
    quantity: number;
    unit_price: number;
}
