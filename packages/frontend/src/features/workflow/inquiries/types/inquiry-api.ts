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
        currency: string;
    } | null;
    preferred_payment_schedule_template_id?: number | null;
    primary_estimate_total?: number | null;
    pipeline_stage?: string | null;
    package_contents_snapshot?: {
        snapshot_taken_at: string;
        package_id: number;
        package_name: string;
        currency?: string;
        contents?: Record<string, unknown>;
        source_day_blueprint_id?: number | null;
        source_day_blueprint_version_id?: number | null;
        source_day_blueprint_display_name?: string | null;
        source_day_blueprint_key?: string | null;
        source_day_blueprint_version_number?: number | null;
    } | null;
    blueprint_drift?: {
        blueprint_id: number;
        consumed_version_id: number;
        consumed_version_number: number | null;
        latest_version_id: number | null;
        latest_version_number: number | null;
        is_current: boolean | null;
    } | null;
    created_at: string;
    updated_at: string;
    welcome_sent_at?: string | null;
    lead_producer_name?: string | null;
    lead_producer?: { id: number; name: string; email?: string | null; label?: string | null; job_role_name?: string | null } | null;
    lead_videographer_name?: string | null;
    lead_videographer?: { id: number; name: string; email?: string | null; label?: string | null; job_role_name?: string | null } | null;
    lead_editor_name?: string | null;
    lead_editor?: { id: number; name: string; email?: string | null; label?: string | null; job_role_name?: string | null } | null;
    estimates?: EstimateApiResponse[];
    proposals?: ProposalApiResponse[];
    quotes?: Array<{ id: number; status: string }>;
    contracts?: Array<{ id: number; status: string }>;
}
