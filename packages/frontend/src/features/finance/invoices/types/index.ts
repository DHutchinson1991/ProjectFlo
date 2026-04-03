export interface InvoiceIdentity {
    inquiryId: number;
    invoiceId: number;
}

export enum InvoiceStatus {
    DRAFT = "Draft",
    SENT = "Sent",
    PAID = "Paid",
    OVERDUE = "Overdue",
    PARTIALLY_PAID = "Partially Paid",
    CANCELLED = "Cancelled",
    VOIDED = "Voided",
}

export interface InvoiceItem {
    id?: number;
    description: string;
    category?: string | null;
    quantity: number;
    unit_price: number;
}

export interface InvoicePayment {
    id: number;
    payment_date: string | null;
    amount: number;
    payment_method: string | null;
    transaction_id?: string | null;
    receipt_url?: string | null;
    card_brand?: string | null;
    card_last4?: string | null;
    payer_email?: string | null;
    currency?: string | null;
}

export interface RecordPaymentData {
    amount: number;
    payment_method?: string;
    transaction_id?: string;
    payment_date?: string;
    notes?: string;
}

export interface InvoiceMilestone {
    id: number;
    label: string;
    amount: number;
    due_date: string;
    status: string;
    order_index: number;
}

export interface InvoiceBrand {
    id: number;
    name: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    logo_url: string | null;
    currency: string;
    tax_number: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_sort_code: string | null;
    bank_account_number: string | null;
    default_payment_method: string | null;
}

export interface InvoiceContact {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
}

export interface Invoice {
    id: number;
    inquiry_id: number;
    brand_id?: number | null;
    project_id?: number | null;
    quote_id?: number | null;
    proposal_id?: number | null;
    milestone_id?: number | null;
    invoice_number: string;
    title?: string | null;
    status: InvoiceStatus | string;
    issue_date: string;
    due_date: string;
    subtotal?: number | null;
    tax_rate?: number | null;
    amount: number;
    amount_paid?: number | null;
    currency?: string | null;
    notes?: string | null;
    terms?: string | null;
    payment_method?: string | null;
    items: InvoiceItem[];
    payments?: InvoicePayment[];
    milestone?: InvoiceMilestone | null;
    brand?: InvoiceBrand | null;
    inquiry?: { id: number; contact: InvoiceContact };
    created_at?: string;
    updated_at?: string;
}

export interface CreateInvoiceData {
    invoice_number: string;
    title?: string;
    issue_date: string;
    due_date: string;
    status?: InvoiceStatus;
    project_id?: number;
    quote_id?: number;
    proposal_id?: number;
    milestone_id?: number;
    tax_rate?: number;
    currency?: string;
    notes?: string;
    terms?: string;
    payment_method?: string;
    items: InvoiceItem[];
}

export interface UpdateInvoiceData {
    invoice_number?: string;
    title?: string;
    issue_date?: string;
    due_date?: string;
    status?: InvoiceStatus;
    project_id?: number;
    tax_rate?: number;
    currency?: string;
    notes?: string;
    terms?: string;
    payment_method?: string;
    items?: InvoiceItem[];
}
