/**
 * Sales Mappers - API Response to Domain Transformation
 *
 * Transform backend API responses to frontend domain models.
 */

import {
    Inquiry,
    Client,
    ClientProject,
    ClientListItem,
    InquiryStatus,
    InquirySource,
    Proposal,
    Estimate,
} from "../domains/sales";
import {
    InquiryApiResponse,
    ClientApiResponse,
    ClientListApiResponse,
    ClientDetailApiResponse,
    ClientProjectApiResponse,
    ProposalApiResponse,
    EstimateApiResponse,
} from "../api/sales";
import { mapContactResponse } from "./users";
import { OutputData } from "@editorjs/editorjs";

// Inquiry mappers
export function mapInquiryResponse(apiResponse: InquiryApiResponse): Inquiry {
    console.log('🔍 Mapper Debug - mapInquiryResponse called with:', apiResponse);
    console.log('🔍 Mapper Debug - apiResponse.contact:', apiResponse.contact);

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
        budget_range: null,
        message: null,
        notes: apiResponse.notes,
        venue_details: apiResponse.venue_details,
        venue_address: apiResponse.venue_address ?? null,
        venue_lat: apiResponse.venue_lat ?? null,
        venue_lng: apiResponse.venue_lng ?? null,
        lead_source: apiResponse.lead_source,
        lead_source_details: apiResponse.lead_source_details,
        // Handle case where contact might not be included in update responses
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
        brand_id: apiResponse.brand_id, // Updated to use actual brand_id
        selected_package_id: apiResponse.selected_package_id,
        selected_package: apiResponse.selected_package
            ? {
                  id: apiResponse.selected_package.id,
                  name: apiResponse.selected_package.name,
                  base_price: parseFloat(apiResponse.selected_package.base_price),
                  currency: apiResponse.selected_package.currency,
              }
            : null,
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
            items: e.items ?? [],
        })),
        proposals: apiResponse.proposals?.map((p) => ({
            ...p,
            sent_at: p.sent_at ? new Date(p.sent_at) : null,
            created_at: new Date(p.created_at),
            updated_at: new Date(p.updated_at),
        })),
        quotes: apiResponse.quotes,
        contracts: apiResponse.contracts,
    };
}

// Client project mappers
export function mapClientProjectResponse(apiResponse: ClientProjectApiResponse): ClientProject {
    return {
        id: apiResponse.id,
        name: apiResponse.name,
        status: apiResponse.status,
        created_at: new Date(apiResponse.created_at),
        start_date: apiResponse.start_date ? new Date(apiResponse.start_date) : null,
        end_date: apiResponse.end_date ? new Date(apiResponse.end_date) : null,
    };
}

// Client mappers
export function mapClientResponse(apiResponse: ClientApiResponse): Client {
    return {
        id: apiResponse.id,
        contact: mapContactResponse(apiResponse.contact),
        contact_id: apiResponse.contact_id,
        brand_id: apiResponse.brand_id,
        created_at: new Date(apiResponse.created_at),
        updated_at: new Date(apiResponse.updated_at),
        projects: apiResponse.projects.map(mapClientProjectResponse),
        latest_project: apiResponse.latest_project
            ? mapClientProjectResponse(apiResponse.latest_project)
            : null,
    };
}

// Client list mapper for simplified list views
export function mapClientListResponse(apiResponse: ClientListApiResponse): ClientListItem {
    return {
        id: apiResponse.id,
        contact: mapContactResponse(apiResponse.contact),
        contact_id: apiResponse.contact_id,
        latest_project_name: apiResponse.latest_project_name,
        latest_wedding_date: apiResponse.latest_wedding_date ? new Date(apiResponse.latest_wedding_date) : null,
    };
}

// Client detail mapper for enhanced client details (getById) with inquiry data
export function mapClientDetailResponse(apiResponse: ClientDetailApiResponse): Client {
    return {
        id: apiResponse.id,
        contact: mapContactResponse(apiResponse.contact),
        contact_id: apiResponse.contact_id,
        brand_id: apiResponse.contact.brand_id || 1, // Use contact's brand_id
        created_at: new Date(), // Could be added to API response later
        updated_at: new Date(), // Could be added to API response later
        projects: apiResponse.projects.map((project) => ({
            id: project.id,
            name: project.project_name,
            status: project.phase || 'active',
            created_at: new Date(project.created_at),
            start_date: project.edit_start_date ? new Date(project.edit_start_date) : null,
            end_date: null, // Not available in current schema
        })),
        latest_project: apiResponse.projects[0] ? {
            id: apiResponse.projects[0].id,
            name: apiResponse.projects[0].project_name,
            status: apiResponse.projects[0].phase || 'active',
            created_at: new Date(apiResponse.projects[0].created_at),
            start_date: apiResponse.projects[0].edit_start_date ? new Date(apiResponse.projects[0].edit_start_date) : null,
            end_date: null,
        } : null,
        inquiry: apiResponse.inquiry ? {
            id: apiResponse.inquiry.id,
            source: apiResponse.inquiry.source as InquirySource,
            status: apiResponse.inquiry.status as InquiryStatus,
            event_date: apiResponse.inquiry.event_date
                ? new Date(apiResponse.inquiry.event_date)
                : apiResponse.inquiry.wedding_date
                    ? new Date(apiResponse.inquiry.wedding_date)
                    : null,
            event_type: null, // Not available in current schema
            budget_range: null, // Not available in current schema
            message: null, // Not available in current schema
            notes: apiResponse.inquiry.notes,
            contact: mapContactResponse(apiResponse.inquiry.contact),
            contact_id: apiResponse.inquiry.contact_id,
            brand_id: apiResponse.inquiry.contact.brand_id || 1,
            created_at: new Date(apiResponse.inquiry.created_at),
            updated_at: new Date(apiResponse.inquiry.updated_at),
        } : null,
    };
}

// Proposal mappers
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
        inquiry: apiResponse.inquiry ? mapInquiryResponse(apiResponse.inquiry) : undefined,
        project: apiResponse.project ? mapClientProjectResponse(apiResponse.project) : null,
    };
}

// Estimate mappers
export function mapEstimateResponse(apiResponse: EstimateApiResponse): Estimate {
    return {
        id: apiResponse.id,
        inquiry_id: apiResponse.inquiry_id,
        project_id: apiResponse.project_id,
        estimate_number: apiResponse.estimate_number,
        title: apiResponse.title,
        status: apiResponse.status,
        issue_date: new Date(apiResponse.issue_date),
        expiry_date: new Date(apiResponse.expiry_date),
        total_amount: apiResponse.total_amount,
        tax_rate: apiResponse.tax_rate,
        deposit_required: apiResponse.deposit_required,
        notes: apiResponse.notes,
        terms: apiResponse.terms,
        version: apiResponse.version ?? 1,
        items: apiResponse.items.map(item => ({
            id: item.id,
            category: item.category,
            description: item.description,
            service_date: item.service_date ? new Date(item.service_date) : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
        })),
        created_at: new Date(apiResponse.created_at),
        updated_at: new Date(apiResponse.updated_at),
    };
}
