/**
 * Project Types — Canonical source.
 *
 * Domain models for projects created from converted inquiries.
 */

import type { Contact } from '@/shared/types/users';

export enum ProjectPhase {
    LEAD = 'Lead',
    INQUIRY = 'Inquiry',
    BOOKING = 'Booking',
    CREATIVE_DEVELOPMENT = 'Creative_Development',
    PRE_PRODUCTION = 'Pre_Production',
    PRODUCTION = 'Production',
    POST_PRODUCTION = 'Post_Production',
    DELIVERY = 'Delivery',
}

export enum ProjectStatus {
    ACTIVE = 'Active',
    ON_HOLD = 'On_Hold',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
}

export type InquiryTaskStatus = 'To_Do' | 'Ready_to_Start' | 'In_Progress' | 'Completed' | 'Archived';

export interface ProjectTaskSubtask {
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
}

export interface ProjectTask {
    id: number;
    inquiry_id: number;
    project_id: number | null;
    task_library_id: number | null;
    parent_inquiry_task_id: number | null;
    name: string;
    description: string | null;
    phase: ProjectPhase;
    status: InquiryTaskStatus;
    order_index: number;
    estimated_hours: number | null;
    due_date: string | null;
    completed_at: string | null;
    is_active: boolean;
    is_task_group: boolean;
    subtasks: ProjectTaskSubtask[];
    assigned_to?: {
        id: number;
        contact: {
            first_name: string | null;
            last_name: string | null;
        };
    } | null;
    job_role?: {
        id: number;
        name: string;
        display_name: string | null;
    } | null;
    children?: ProjectTask[];
}

export interface Project {
    id: number;
    project_name: string | null;
    wedding_date: string;
    booking_date: string | null;
    edit_start_date: string | null;
    delivery_date: string | null;
    phase: ProjectPhase;
    status: ProjectStatus;
    brand_id: number | null;
    client_id: number;
    contact_id: number | null;
    inquiry_id: number | null;
    source_package_id: number | null;
    event_type_id: number | null;
    guest_count: string | null;
    notes: string | null;
    portal_token: string | null;
    package_contents_snapshot: {
        snapshot_taken_at: string;
        package_id: number;
        package_name: string;
        currency?: string;
        contents?: Record<string, unknown>;
    } | null;
    archived_at: string | null;
    created_at: string;
    updated_at: string;
    brand?: {
        id: number;
        name: string;
        display_name?: string;
    };
    contact?: Contact | null;
    client?: {
        id: number;
        contact: {
            first_name?: string;
            last_name?: string;
            email: string;
            phone_number?: string;
        };
    };
    event_type?: {
        id: number;
        name: string;
        icon?: string | null;
        color?: string | null;
    } | null;
    source_package?: {
        id: number;
        name: string;
    } | null;
    workflow_template?: {
        id: number;
        name: string;
        description?: string;
    } | null;
    proposals?: import('@/features/workflow/proposals/types').Proposal[];
    contracts?: import('@/features/finance/contracts/types').Contract[];
    quotes?: import('@/features/finance/quotes/types').Quote[];
    invoices?: import('@/features/finance/invoices/types').Invoice[];
    estimates?: import('@/features/finance/estimates/types').Estimate[];
    inquiry_tasks?: ProjectTask[];
    documents?: Array<{
        id: number;
        file_name: string;
        file_path: string;
        upload_date: string;
        document_type: string;
        status: string;
    }>;
}

export interface ProjectListItem {
    id: number;
    project_name: string | null;
    wedding_date: string;
    booking_date: string | null;
    edit_start_date: string | null;
    delivery_date: string | null;
    phase: ProjectPhase;
    status: ProjectStatus;
    brand_id: number | null;
    client_id: number;
    contact_id: number | null;
    inquiry_id: number | null;
    guest_count: string | null;
    created_at: string;
    contact?: {
        id: number;
        first_name?: string | null;
        last_name?: string | null;
        email: string;
        phone_number?: string | null;
    } | null;
    source_package?: {
        id: number;
        name: string;
    } | null;
    event_type?: {
        id: number;
        name: string;
        icon?: string | null;
        color?: string | null;
    } | null;
}

export interface UpdateProjectRequest {
    project_name?: string;
    wedding_date?: string;
    booking_date?: string;
    edit_start_date?: string;
    delivery_date?: string;
    phase?: ProjectPhase;
    status?: ProjectStatus;
    notes?: string;
    guest_count?: string;
    event_type_id?: number;
}
