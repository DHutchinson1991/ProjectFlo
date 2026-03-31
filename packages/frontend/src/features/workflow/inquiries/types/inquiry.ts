/**
 * Inquiry Types — Canonical source.
 *
 * Domain models for lead inquiries, inquiry tasks, and crew/equipment availability.
 */

import type { Contact } from '@/shared/types/users';

// Enums from Prisma
export enum InquiryStatus {
    NEW = "New",
    QUALIFIED = "Qualified",
    CONTACTED = "Contacted",
    DISCOVERY_CALL = "Discovery_Call",
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

export interface Inquiry {
    id: number;
    source: InquirySource;
    status: InquiryStatus;
    event_date?: Date | null;
    event_type?: string | null;
    event_type_id?: number | null;
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
        currency: string;
    } | null;
    preferred_payment_schedule_template_id?: number | null;
    preferred_payment_schedule_template?: {
        id: number;
        name: string;
        is_default: boolean;
    } | null;
    primary_estimate_total?: number | null;
    primary_quote_total?: number | null;
    pipeline_stage?: string | null;
    pipeline_stages?: Array<{
        name: string;
        order_index: number;
        total_children: number;
        completed_children: number;
    }>;
    source_package_id?: number | null;
    package_contents_snapshot?: {
        snapshot_taken_at: string;
        package_id: number;
        package_name: string;
        currency?: string;
        contents?: Record<string, unknown>;
    } | null;
    workflow_status?: Record<string, string>;
    contact: Contact;
    contact_id: number;
    brand_id: number;
    created_at: Date;
    updated_at: Date;
    proposals?: import('@/features/workflow/proposals/types').Proposal[];
    contracts?: import('@/features/finance/contracts/types').Contract[];
    quotes?: import('@/features/finance/quotes/types').Quote[];
    invoices?: import('@/features/finance/invoices/types').Invoice[];
    estimates?: import('@/features/finance/estimates/types').Estimate[];
    activity_logs?: never;
    welcome_sent_at?: string | null;
    lead_producer?: {
        id: number;
        name: string;
        email?: string | null;
        label?: string | null;
        job_role_name?: string | null;
    } | null;
}

export type InquiryTaskStatus = 'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived';

export interface InquiryTaskEvent {
    id: number;
    task_id: number;
    event_type: string;
    triggered_by?: string | null;
    description: string;
    occurred_at: string;
}

export interface InquiryTaskSubtask {
    id: number;
    inquiry_task_id: number;
    subtask_key: string;
    name: string;
    status: InquiryTaskStatus;
    order_index: number;
    is_auto_only: boolean;
    completed_at: string | null;
    completed_by_id: number | null;
    job_role_id: number | null;
    created_at: string;
    updated_at: string;
    completed_by?: {
        id: number;
        contact: { first_name: string; last_name: string; email?: string };
    } | null;
    job_role?: {
        id: number;
        name: string;
        display_name?: string | null;
    } | null;
}

export interface InquiryTask {
    id: number;
    inquiry_id: number;
    task_library_id: number | null;
    parent_inquiry_task_id: number | null;
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
    assigned_to_id: number | null;
    job_role_id: number | null;
    is_active: boolean;
    is_task_group: boolean;
    created_at: string;
    updated_at: string;
    task_library?: {
        id: number;
        name: string;
        effort_hours: number | null;
        trigger_type: string;
        is_task_group?: boolean;
        parent_task_id?: number | null;
        is_auto_only?: boolean;
    } | null;
    completed_by?: {
        id: number;
        contact: { first_name: string; last_name: string };
    } | null;
    assigned_to?: {
        id: number;
        contact: { first_name: string; last_name: string; email?: string };
    } | null;
    job_role?: {
        id: number;
        name: string;
        display_name?: string | null;
    } | null;
    subtasks?: InquiryTaskSubtask[];
    children?: InquiryTask[];
}

export interface InquiryAvailabilityAlternativeCrew {
    id: number;
    name: string;
    email?: string | null;
    is_current?: boolean;
    has_role?: boolean;
    conflicts?: InquiryAvailabilityConflict[];
}

export interface InquiryAvailabilityConflict {
    type: 'project' | 'inquiry';
    id: number | null;
    title: string;
    event_day_name?: string | null;
    start_time?: string | null;
    end_time?: string | null;
}

export interface InquiryCrewAvailabilityRow {
    id: number;
    label?: string | null;
    job_role?: {
        id: number;
        name: string;
        display_name?: string | null;
        on_site?: boolean;
    } | null;
    event_day?: {
        id: number;
        name: string;
        date: string;
        start_time?: string | null;
        end_time?: string | null;
    } | null;
    assigned_crew?: {
        id: number;
        name: string;
        email?: string | null;
    } | null;
    status: 'available' | 'conflict' | 'unassigned';
    has_conflict: boolean;
    conflict_reason?: string | null;
    conflicts: InquiryAvailabilityConflict[];
    alternatives: InquiryAvailabilityAlternativeCrew[];
    is_on_site?: boolean;
    confirmed?: boolean;
    availability_request_id?: number | null;
    availability_request_status?: 'pending' | 'confirmed' | 'declined' | 'cancelled' | null;
}

export interface InquiryEquipmentAvailabilityAlternative {
    id: number;
    item_name: string;
    item_code?: string | null;
    category?: string | null;
    type?: string | null;
    is_current?: boolean;
    conflicts?: InquiryAvailabilityConflict[];
}

export interface InquiryEquipmentAvailabilityRow {
    id: number;
    operator_id: number;
    is_primary: boolean;
    equipment: {
        id: number;
        item_name: string;
        item_code?: string | null;
        category?: string | null;
        type?: string | null;
        availability_status?: string | null;
        rental_price_per_day?: number | null;
        owner?: {
            id: number;
            name: string;
            email?: string | null;
            phone?: string | null;
        } | null;
    };
    crew_slot: {
        id: number;
        label?: string | null;
        job_role?: {
            id: number;
            name: string;
            display_name?: string | null;
        } | null;
    };
    event_day?: {
        id: number;
        name: string;
        date: string;
        start_time?: string | null;
        end_time?: string | null;
    } | null;
    status: 'available' | 'conflict';
    has_conflict: boolean;
    conflict_reason?: string | null;
    conflicts: InquiryAvailabilityConflict[];
    alternatives: InquiryEquipmentAvailabilityAlternative[];
    equipment_reservation_id?: number | null;
    equipment_reservation_status?: 'reserved' | 'confirmed' | 'cancelled' | null;
}

export interface InquiryAvailabilityResponse<T> {
    inquiry_id: number;
    rows: T[];
    summary: {
        total: number;
        resolved: number;
        conflicts: number;
    };
}

// DTOs
export interface CreateInquiryData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    wedding_date?: string;
    status?: InquiryStatus;
    notes?: string;
    lead_source?: string;
    lead_source_details?: string;
    event_type_id?: number | null;
}

export interface UpdateInquiryData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    wedding_date?: string;
    status?: InquiryStatus;
    notes?: string;
    lead_source?: string;
    lead_source_details?: string;
    preferred_payment_schedule_template_id?: number | null;
    selected_package_id?: number | null;
    event_type?: string | null;
    budget_range?: string | null;
    message?: string | null;
    event_type_id?: number | null;
}
