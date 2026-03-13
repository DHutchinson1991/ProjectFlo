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
    tax_rate?: number;
    deposit_required?: number;
    payment_method?: string;
    installments?: number;
    is_primary?: boolean;
    notes?: string;
    terms?: string;
    schedule_template_id?: number | null;
    items: EstimateItem[];
    payment_milestones?: EstimatePaymentMilestone[];
    created_at: Date;
    updated_at: Date;
    inquiry?: Inquiry;
    project?: ClientProject | null;
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
    tax_rate?: number;
    deposit_required?: number;
    payment_method?: string;
    installments?: number;
    is_primary?: boolean;
    consultation_notes?: string | null;
    notes?: string;
    terms?: string;
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
    venue_address?: string | null;
    venue_lat?: number | null;
    venue_lng?: number | null;
    lead_source?: string | null;
    lead_source_details?: string | null;
    selected_package_id?: number | null;
    selected_package?: {
        id: number;
        name: string;
        base_price: number;
        currency: string;
    } | null;
    primary_estimate_total?: number | null;
    pipeline_stage?: string | null;
    source_package_id?: number | null;
    package_contents_snapshot?: {
        snapshot_taken_at: string;
        package_id: number;
        package_name: string;
        base_price?: number;
        currency?: string;
        contents?: Record<string, unknown>;
    } | null;
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
    activity_logs?: unknown[];
}

export type InquiryTaskStatus = 'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived';

export interface InquiryTask {
    id: number;
    inquiry_id: number;
    task_library_id: number | null;
    name: string;
    description: string | null;
    phase: 'Inquiry' | 'Booking';
    trigger_type: string;
    estimated_hours: number | null;
    due_date: string | null;
    status: InquiryTaskStatus;
    order_index: number;
    completed_at: string | null;
    completed_by_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    task_library?: {
        id: number;
        name: string;
        effort_hours: number | null;
        trigger_type: string;
    } | null;
    completed_by?: {
        id: number;
        contact: { first_name: string; last_name: string };
    } | null;
}

export interface ClientProject {
    id: number;
    name: string;
    status: string;
    created_at: Date;
    start_date?: Date | null;
    end_date?: Date | null;
}

export interface ServicePackageItem {
    id?: string; // For ad-hoc items
    description: string;
    price: number;
    type: 'film' | 'service';
    referenceId?: number; // ID of the referenced film if type is 'film'
    config?: {
        linked_film_id?: number; // Film instance linked to this package item
        template_film_id?: number; // Original film template used to seed the linked film
        operator_count?: number;
        scenes?: unknown[];
        scene_overrides?: Record<string, any>;
        [key: string]: any;
    };
}

export interface ServicePackage {
    id: number;
    brand_id: number;
    name: string;
    description: string | null;
    category: string | null;
    base_price: number;
    currency: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    workflow_template_id?: number | null;
    workflow_template?: {
        id: number;
        name: string;
        description?: string;
        is_default: boolean;
        is_active?: boolean;
        _count?: { workflow_template_tasks: number };
    } | null;
    contents: {
        subject_template_id?: number | null;
        equipment_template_id?: number | null;
        equipment_counts?: {
            cameras?: number;
            audio?: number;
        };
        equipment_overrides?: Record<number, boolean>;
        /** Per-day coverage settings keyed by event day template id */
        day_coverage?: Record<number, {
            mode: 'hours' | 'window';
            hours?: number;
            window?: { from: string; to: string };
        }>;
        // Legacy global coverage (kept for migration)
        coverage_mode?: 'hours' | 'window';
        coverage_hours?: number;
        coverage_window?: { from: string; to: string };
        /** Extra equipment added to this specific package beyond the template */
        extra_equipment?: Array<{
            equipment_id: number;
            slot_type: 'CAMERA' | 'AUDIO';
            equipment?: { id: number; item_name: string; model?: string | null };
        }>;
        /** Equipment assigned per event day, keyed by event-day ID (stringified) */
        day_equipment?: Record<string, Array<{
            equipment_id: number;
            slot_type: 'CAMERA' | 'AUDIO';
            track_number?: number;
            equipment?: { id: number; item_name: string; model?: string | null };
        }>>;
        /** Activity-level equipment overrides, keyed by activity ID (stringified) */
        activity_equipment?: Record<string, Array<{
            equipment_id: number;
            slot_type: 'CAMERA' | 'AUDIO';
            track_number?: number;
            equipment?: { id: number; item_name: string; model?: string | null };
        }>>;
        items: ServicePackageItem[];
    };
}

// Proposal Section Types
export type SectionType = 'hero' | 'text' | 'pricing' | 'media' | 'interactive' | 'schedule';

export interface BaseSection {
    id: string;
    type: SectionType;
    isVisible: boolean;
}

export interface HeroSection extends BaseSection {
    type: 'hero';
    data: {
        title: string;
        date?: string;
        subtitle?: string;
        backgroundImageUrl?: string;
        backgroundVideoUrl?: string;
        scrollText?: string;
    };
}

export interface TextSection extends BaseSection {
    type: 'text';
    data: {
        blocks: any[]; // EditorJS blocks
    };
}

export interface PricingSection extends BaseSection {
    type: 'pricing';
    data: {
        quoteId?: number;
        packageId?: number;
        items?: ServicePackageItem[]; // Using ServicePackageItem[]
        showLineItems: boolean;
        showTotal: boolean;
        allowAddons: boolean;
    };
}

export interface MediaSection extends BaseSection {
    type: 'media';
    data: {
        items: Array<{
            id: string;
            type: 'video' | 'image';
            url: string;
            thumbnailUrl?: string;
            caption?: string;
        }>;
        layout: 'grid' | 'filmstrip' | 'featured';
    };
}

export interface InteractiveSection extends BaseSection {
    type: 'interactive';
    data: {
        question: string;
        options: Array<{
            id: string;
            label: string;
            value: string;
            thumbnailUrl?: string;
        }>;
        selectedOptionId?: string;
    };
}

export interface ScheduleSection extends BaseSection {
    type: 'schedule';
    data: {
        /** Source of schedule data: inquiry or project */
        ownerType: 'inquiry' | 'project';
        /** ID of the inquiry or project */
        ownerId: number;
        /** Display title for the section */
        title?: string;
        /** Whether to show activity details (moments, crew, etc.) */
        showDetails?: boolean;
    };
}

export type ProposalSection = HeroSection | TextSection | PricingSection | MediaSection | InteractiveSection | ScheduleSection;

export interface ProposalContent {
    theme: 'cinematic-dark' | 'clean-light' | 'soft-romance';
    meta: {
        personalVideoUrl?: string;
        expirationDate?: string;
        customCss?: string;
    };
    sections: ProposalSection[];
}

// Proposal types
export interface Proposal {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    title: string;
    content: ProposalContent | OutputData | any | null; // Support legacy and new structure
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
    venue_address?: string | null;
    venue_lat?: number | null;
    venue_lng?: number | null;
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

// ── Payment Schedule Types ────────────────────────────────────────────────────

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

export interface ApplyScheduleToEstimateData {
    template_id: number;
    booking_date: string;  // ISO
    event_date: string;    // ISO
    total_amount: number;
}


