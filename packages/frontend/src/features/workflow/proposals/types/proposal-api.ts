/**
 * Proposal API Response Types
 *
 * Types matching the exact structure returned by the backend API for proposals.
 */

import type { InquiryApiResponse } from '@/features/workflow/inquiries/types/inquiry-api';
import type { ClientProjectApiResponse } from '@/features/workflow/clients/types/client-api';

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
    created_at: string;
    updated_at: string;
    inquiry?: InquiryApiResponse;
    project?: ClientProjectApiResponse | null;
}
