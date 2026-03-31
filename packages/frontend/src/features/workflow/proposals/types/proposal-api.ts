/**
 * Proposal API Response Types
 *
 * Types matching the exact structure returned by the backend API for proposals.
 */

import type { InquiryApiResponse } from '@/features/workflow/inquiries/types/inquiry-api';
import type { ClientProjectApiResponse } from '@/features/workflow/clients/types/client-api';

export interface ProposalSectionViewApiResponse {
    section_type: string;
    viewed_at: string;
    duration_seconds: number;
}

export interface ProposalContractSignerApiResponse {
    status: string;
    viewed_at: string | null;
    signed_at: string | null;
}

export interface ProposalContractApiResponse {
    id: number;
    status: string;
    sent_at: string | null;
    signed_date: string | null;
    signers: ProposalContractSignerApiResponse[];
}

export interface ProposalApiResponse {
    id: number;
    inquiry_id: number;
    project_id: number | null;
    title: string;
    content: Record<string, unknown> | null;
    status: string;
    version: number;
    sent_at: string | null;
    share_token: string | null;
    client_response: string | null;
    client_response_at: string | null;
    client_response_message: string | null;
    viewed_at: string | null;
    view_count: number;
    created_at: string;
    updated_at: string;
    inquiry?: InquiryApiResponse & { contracts?: ProposalContractApiResponse[] };
    project?: ClientProjectApiResponse | null;
    section_views?: ProposalSectionViewApiResponse[];
    section_notes?: Array<{ section_type: string; note: string; created_at: string; updated_at: string }>;
}
