/**
 * Sales Domain Types - Lead Inquiries and Clients
 *
 * Domain models representing sales-related entities in the frontend.
 */

import { Contact } from "./users";
import { OutputData } from "@editorjs/editorjs";

// Enums from Prisma
export enum InquiryStatus {
    NEW = "New",
    CONTACTED = "Contacted",
    PROPOSAL_SENT = "Proposal_Sent",
    WON = "Booked",
    LOST = "Closed_Lost",
}

export enum InquirySource {
    WEBSITE = "WEBSITE",
    REFERRAL = "REFERRAL",
    SOCIAL_MEDIA = "SOCIAL_MEDIA",
    PHONE = "PHONE",
    EMAIL = "EMAIL",
    OTHER = "OTHER",
}

// Contract types
export enum ContractStatus {
    DRAFT = "Draft",
    SENT = "Sent",
    SIGNED = "Signed",
    CANCELLED = "Cancelled",
}

// Invoice types
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

export interface ClientProject {
    id: number;
    name: string;
    status: string;
    created_at: Date;
    start_date?: Date | null;
    end_date?: Date | null;
}

export interface Contract {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    title: string;
    content?: OutputData | null;
    status: ContractStatus;
    created_at: Date;
    updated_at: Date;
    inquiry?: Inquiry;
    project?: ClientProject | null;
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
    inquiry?: Inquiry;
    project?: ClientProject | null;
}

export interface EstimateItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
}

export interface Estimate {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    estimate_number: string;
    status: string; // "Draft", "Sent", "Accepted", "Declined"
    issue_date: Date;
    expiry_date: Date;
    total_amount: number;
    items: EstimateItem[];
    created_at: Date;
    updated_at: Date;
    inquiry?: Inquiry;
    project?: ClientProject | null;
}

export interface QuoteItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
}

export interface Quote {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    quote_number: string;
    status: string; // "Draft", "Sent", "Accepted", "Declined"
    issue_date: Date;
    expiry_date: Date;
    total_amount: number;
    consultation_notes?: string | null;
    items: QuoteItem[];
    created_at: Date;
    updated_at: Date;
    inquiry?: Inquiry;
    project?: ClientProject | null;
}

// Domain interfaces
export interface Inquiry {
    id: number;
    source: InquirySource;
    status: InquiryStatus;
    event_date?: Date | null;
    event_type?: string | null;
    budget_range?: string | null;
    message?: string | null;
    notes?: string | null;
    venue_details?: string | null;
    lead_source?: string | null;
    lead_source_details?: string | null;
    workflow_status?: Record<string, string>; // Track checklist state
    contact: Contact;
    contact_id: number;
    brand_id: number;
    created_at: Date;
    updated_at: Date;
    proposals?: Proposal[];
    contracts?: Contract[];
    quotes?: Quote[];
    invoices?: Invoice[];
    estimates?: Estimate[];
}

export interface ClientProject {
    id: number;
    name: string;
    status: string;
    created_at: Date;
    start_date?: Date | null;
    end_date?: Date | null;
}

// Proposal types
export interface Proposal {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    title: string;
    content?: OutputData | null;
    status: string; // "Draft", "Sent", "Accepted", "Declined"
    version: number;
    sent_at?: Date | null;
    created_at: Date;
    updated_at: Date;
    inquiry?: Inquiry;
    project?: ClientProject | null;
}

export interface Client {
    id: number;
    contact: Contact;
    contact_id: number;
    brand_id: number;
    created_at: Date;
    updated_at: Date;
    projects: ClientProject[];
    latest_project?: ClientProject | null;
    inquiry?: Inquiry | null; // NEW: Include original inquiry data
}

// Simplified client for list views
export interface ClientListItem {
    id: number;
    contact: Contact;
    contact_id: number;
    latest_project_name: string | null;
    latest_wedding_date: Date | null;
}

// Create/Update DTOs - Match backend structure
export interface CreateInquiryData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    wedding_date?: string;
    status?: InquiryStatus;
    notes?: string;
    venue_details?: string;
    lead_source?: string;
    lead_source_details?: string;
}

export interface UpdateInquiryData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    wedding_date?: string;
    status?: InquiryStatus;
    notes?: string;
    venue_details?: string;
    lead_source?: string;
    lead_source_details?: string;
}

// Client CRUD DTOs
export interface CreateClientData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    company_name?: string;
}

export interface UpdateClientData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    company_name?: string;
}

// Proposal CRUD DTOs
export interface CreateProposalData {
    title?: string;
    content?: OutputData;
    status?: string;
    version?: number;
}

export interface UpdateProposalData {
    title?: string;
    content?: OutputData;
    status?: string;
    version?: number;
}

export interface CreateContractData {
    title: string;
    content?: OutputData;
    status?: ContractStatus;
    project_id?: number;
}

export interface UpdateContractData {
    title?: string;
    content?: OutputData;
    status?: ContractStatus;
    project_id?: number;
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

export interface CreateEstimateData {
    estimate_number: string;
    issue_date: string;
    expiry_date: string;
    status?: string;
    project_id?: number;
    items: EstimateItem[];
}

export interface UpdateEstimateData {
    estimate_number?: string;
    issue_date?: string;
    expiry_date?: string;
    status?: string;
    project_id?: number;
    items?: EstimateItem[];
}

export interface CreateQuoteData {
    quote_number: string;
    issue_date: string;
    expiry_date: string;
    consultation_notes?: string;
    status?: string;
    project_id?: number;
    items: QuoteItem[];
}

export interface UpdateQuoteData {
    quote_number?: string;
    issue_date?: string;
    expiry_date?: string;
    consultation_notes?: string;
    status?: string;
    project_id?: number;
    items?: QuoteItem[];
}
