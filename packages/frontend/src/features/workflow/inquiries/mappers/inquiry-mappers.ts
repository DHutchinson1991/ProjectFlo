/**
 * Inquiry & Proposal Mappers - API Response to Domain Transformation
 *
 * mapInquiryResponse and mapProposalResponse are co-located because they
 * are mutually recursive (an inquiry contains proposals, a proposal may
 * contain an inquiry).
 */

import type {
    Inquiry,
} from '@/features/workflow/inquiries/types/inquiry';
import {
    InquiryStatus,
    InquirySource,
} from '@/features/workflow/inquiries/types/inquiry';
import type { Proposal } from '@/features/workflow/proposals/types';
import type { ProposalInquirySummary } from '@/features/workflow/proposals/types';
import type { InquiryApiResponse } from '@/features/workflow/inquiries/types/inquiry-api';
import type { ProposalApiResponse } from '@/features/workflow/proposals/types/proposal-api';
import { mapContactResponse } from '@/shared/types/user-mappers';
import { mapClientProjectResponse } from '@/features/workflow/clients/mappers/client-mappers';
import type { OutputData } from '@editorjs/editorjs';

export function mapInquiryResponse(apiResponse: InquiryApiResponse): Inquiry {
    return {
        id: apiResponse.id,
        source: (apiResponse.source as InquirySource) || InquirySource.OTHER,
        status: (apiResponse.status as InquiryStatus) || InquiryStatus.NEW,
        event_date: apiResponse.event_date
            ? new Date(apiResponse.event_date)
            : apiResponse.wedding_date
                ? new Date(apiResponse.wedding_date)
                : null,
        event_type: apiResponse.event_type?.name ?? null,
        event_type_id: apiResponse.event_type_id ?? null,
        budget_range: null,
        message: null,
        notes: apiResponse.notes,
        venue_details: apiResponse.venue_details,
        venue_address: apiResponse.venue_address ?? null,
        venue_lat: apiResponse.venue_lat ?? null,
        venue_lng: apiResponse.venue_lng ?? null,
        lead_source: apiResponse.lead_source,
        lead_source_details: apiResponse.lead_source_details,
        contact: apiResponse.contact ? mapContactResponse(apiResponse.contact) : {
            id: apiResponse.contact_id || 0,
            email: '',
            first_name: '',
            last_name: '',
            full_name: 'Unknown Contact',
            phone_number: undefined,
            company_name: undefined,
            type: 'CLIENT',
            brand_id: undefined,
            archived_at: null,
        },
        contact_id: apiResponse.contact_id,
        brand_id: apiResponse.brand_id,
        selected_package_id: apiResponse.selected_package_id,
        selected_package: apiResponse.selected_package
            ? {
                  id: apiResponse.selected_package.id,
                  name: apiResponse.selected_package.name,
                  currency: apiResponse.selected_package.currency,
              }
            : null,
        preferred_payment_schedule_template_id: apiResponse.preferred_payment_schedule_template_id ?? null,
        primary_estimate_total: apiResponse.primary_estimate_total ?? null,
        pipeline_stage: apiResponse.pipeline_stage ?? null,
        package_contents_snapshot: apiResponse.package_contents_snapshot ?? null,
        created_at: new Date(apiResponse.created_at),
        updated_at: new Date(apiResponse.updated_at),
        estimates: apiResponse.estimates?.map((e) => ({
            ...e,
            issue_date: new Date(e.issue_date),
            expiry_date: new Date(e.expiry_date),
            created_at: new Date(e.created_at),
            updated_at: new Date(e.updated_at),
            items: (e.items ?? []).map((item) => ({
                ...item,
                service_date: item.service_date ? new Date(item.service_date) : (item.service_date as null | undefined),
            })),
        })),
        proposals: apiResponse.proposals?.map(mapProposalResponse),
        quotes: apiResponse.quotes as Inquiry['quotes'],
        contracts: apiResponse.contracts as Inquiry['contracts'],
        welcome_sent_at: apiResponse.welcome_sent_at ?? null,
    };
}

export function mapProposalResponse(apiResponse: ProposalApiResponse): Proposal {
    return {
        id: apiResponse.id,
        inquiry_id: apiResponse.inquiry_id,
        project_id: apiResponse.project_id,
        title: apiResponse.title,
        content: apiResponse.content ? (apiResponse.content as unknown as OutputData) : null,
        status: apiResponse.status,
        version: apiResponse.version,
        sent_at: apiResponse.sent_at ? new Date(apiResponse.sent_at) : null,
        share_token: apiResponse.share_token ?? null,
        client_response: apiResponse.client_response ?? null,
        client_response_at: apiResponse.client_response_at ? new Date(apiResponse.client_response_at) : null,
        client_response_message: apiResponse.client_response_message ?? null,
        created_at: new Date(apiResponse.created_at),
        updated_at: new Date(apiResponse.updated_at),
        inquiry: apiResponse.inquiry ? {
            id: apiResponse.inquiry.id,
            contact: {
                first_name: apiResponse.inquiry.contact.first_name,
                last_name: apiResponse.inquiry.contact.last_name,
                email: apiResponse.inquiry.contact.email,
            },
        } as ProposalInquirySummary : undefined,
        project: apiResponse.project ? mapClientProjectResponse(apiResponse.project) : null,
    };
}
