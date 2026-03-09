/**
 * Sales API Types - Backend Response Structures
 *
 * Types matching the exact structure returned by the backend API.
 */

import { ContactApiResponse } from "./users";

// Backend API response interfaces
export interface InquiryApiResponse {
    id: number;
    source: string;
    status: string;
    event_date: string | null;
    wedding_date: string | null; // For backward compatibility
    notes: string | null;
    venue_details: string | null;
    venue_address?: string | null;
    venue_lat?: number | null;
    venue_lng?: number | null;
    lead_source: string | null;
    lead_source_details: string | null;
    contact: ContactApiResponse;
    contact_id: number;
    brand_id: number;
    selected_package_id?: number | null;
    created_at: string;
    updated_at: string;
}

export interface ClientProjectApiResponse {
    id: number;
    name: string;
    status: string;
    created_at: string;
    start_date: string | null;
    end_date: string | null;
}

export interface ClientApiResponse {
    id: number;
    contact: ContactApiResponse;
    contact_id: number;
    brand_id: number;
    created_at: string;
    updated_at: string;
    projects: ClientProjectApiResponse[];
    latest_project?: ClientProjectApiResponse | null;
}

// Simplified client response for list views
export interface ClientListApiResponse {
    id: number;
    contact: ContactApiResponse;
    contact_id: number;
    latest_project_name: string | null;
    latest_wedding_date: string | null;
}

// Enhanced client response for individual client details (getById) with inquiry data
export interface ClientDetailApiResponse {
    id: number;
    contact_id: number;
    inquiry_id: number | null;
    archived_at: string | null;
    contact: ContactApiResponse;
    projects: Array<{
        id: number;
        project_name: string;
        wedding_date: string;
        phase: string;
        booking_date: string | null;
        edit_start_date: string | null;
        archived_at: string | null;
        created_at: string;
        updated_at: string;
    }>;
    inquiry: {
        id: number;
        source: string;
        status: string;
        event_date: string | null;
        wedding_date: string | null;
        notes: string | null;
        venue_details: string | null;
        lead_source: string | null;
        lead_source_details: string | null;
        contact_id: number;
        created_at: string;
        updated_at: string;
        contact: ContactApiResponse;
    } | null;
}

// Proposal API response types
export interface ProposalApiResponse {
    id: number;
    inquiry_id: number;
    project_id: number | null;
    title: string;
    content: Record<string, unknown> | null; // JSON content from EditorJS
    status: string;
    version: number;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
    inquiry?: InquiryApiResponse;
    project?: ClientProjectApiResponse | null;
}

export interface EstimateItemApiResponse {
    id?: number;
    category?: string;
    description: string;
    service_date?: string | null;
    start_time?: string;
    end_time?: string;
    quantity: number;
    unit?: string;
    unit_price: number;
}

export interface EstimateApiResponse {
    id: number;
    inquiry_id: number;
    project_id: number | null;
    estimate_number: string;
    title?: string;
    status: string;
    issue_date: string;
    expiry_date: string;
    total_amount: number;
    tax_rate?: number;
    deposit_required?: number;
    notes?: string;
    terms?: string;
    items: EstimateItemApiResponse[];
    created_at: string;
    updated_at: string;
}
