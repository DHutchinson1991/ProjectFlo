/**
 * Inquiry API Response Types
 *
 * Types matching the exact structure returned by the backend API for inquiries.
 */

import type { ContactApiResponse } from '@/shared/types/user-api';
import type { EstimateApiResponse } from '@/features/finance/estimates/types/estimate-api';
import type { ProposalApiResponse } from '@/features/workflow/proposals/types/proposal-api';

export interface InquiryApiResponse {
    id: number;
    source: string;
    status: string;
    event_date: string | null;
    wedding_date: string | null;
    notes: string | null;
    venue_details: string | null;
    venue_address?: string | null;
    venue_lat?: number | null;
    venue_lng?: number | null;
    lead_source: string | null;
    lead_source_details: string | null;
    event_type_id?: number | null;
    event_type?: { id: number; name: string } | null;
    contact: ContactApiResponse;
    contact_id: number;
    brand_id: number;
    selected_package_id?: number | null;
    selected_package?: {
        id: number;
        name: string;
        base_price: string;
        currency: string;
    } | null;
    preferred_payment_schedule_template_id?: number | null;
    primary_estimate_total?: number | null;
    pipeline_stage?: string | null;
    package_contents_snapshot?: {
        snapshot_taken_at: string;
        package_id: number;
        package_name: string;
        base_price?: number;
        currency?: string;
        contents?: Record<string, unknown>;
    } | null;
    created_at: string;
    updated_at: string;
    welcome_sent_at?: string | null;
    estimates?: EstimateApiResponse[];
    proposals?: ProposalApiResponse[];
    quotes?: Array<{ id: number; status: string }>;
    contracts?: Array<{ id: number; status: string }>;
}
