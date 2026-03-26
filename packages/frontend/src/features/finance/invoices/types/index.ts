export interface InvoiceIdentity {
    inquiryId: number;
    invoiceId: number;
}

export enum InvoiceStatus {
    DRAFT = "Draft",
    SENT = "Sent",
    PAID = "Paid",
    OVERDUE = "Overdue",
}

export interface InvoiceItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
}

export interface Invoice {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    invoice_number: string;
    status: InvoiceStatus;
    issue_date: Date;
    due_date: Date;
    amount: number;
    amount_paid?: number | null;
    items: InvoiceItem[];
    created_at: Date;
    updated_at: Date;
    inquiry?: { id: number; contact_id: number; brand_id: number };
    project?: { id: number; name: string; status: string; created_at: Date; start_date?: Date | null; end_date?: Date | null } | null;
}

export interface CreateInvoiceData {
    invoice_number: string;
    issue_date: string;
    due_date: string;
    status?: InvoiceStatus;
    project_id?: number;
    items: InvoiceItem[];
}

export interface UpdateInvoiceData {
    invoice_number?: string;
    issue_date?: string;
    due_date?: string;
    status?: InvoiceStatus;
    project_id?: number;
    items?: InvoiceItem[];
}
