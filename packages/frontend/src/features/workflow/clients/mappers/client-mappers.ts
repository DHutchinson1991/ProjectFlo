/**
 * Client Mappers - API Response to Domain Transformation
 *
 * Transform backend client API responses to frontend domain models.
 */

import type {
    Client,
    ClientProject,
    ClientListItem,
} from '@/features/workflow/clients/types';
import type {
    ClientApiResponse,
    ClientListApiResponse,
    ClientDetailApiResponse,
    ClientProjectApiResponse,
} from '@/features/workflow/clients/types/client-api';
import { mapContactResponse } from '@/shared/types/user-mappers';
import { InquirySource, InquiryStatus } from '@/features/workflow/inquiries/types/inquiry';

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

export function mapClientListResponse(apiResponse: ClientListApiResponse): ClientListItem {
    return {
        id: apiResponse.id,
        contact: mapContactResponse(apiResponse.contact),
        contact_id: apiResponse.contact_id,
        latest_project_name: apiResponse.latest_project_name,
        latest_wedding_date: apiResponse.latest_wedding_date ? new Date(apiResponse.latest_wedding_date) : null,
    };
}

export function mapClientDetailResponse(apiResponse: ClientDetailApiResponse): Client {
    return {
        id: apiResponse.id,
        contact: mapContactResponse(apiResponse.contact),
        contact_id: apiResponse.contact_id,
        brand_id: apiResponse.contact.brand_id || 1,
        created_at: new Date(),
        updated_at: new Date(),
        projects: apiResponse.projects.map((project) => ({
            id: project.id,
            name: project.project_name,
            status: project.phase || 'active',
            created_at: new Date(project.created_at),
            start_date: project.edit_start_date ? new Date(project.edit_start_date) : null,
            end_date: null,
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
            event_type: null,
            budget_range: null,
            message: null,
            notes: apiResponse.inquiry.notes,
            contact: mapContactResponse(apiResponse.inquiry.contact),
            contact_id: apiResponse.inquiry.contact_id,
            brand_id: apiResponse.inquiry.contact.brand_id || 1,
            created_at: new Date(apiResponse.inquiry.created_at),
            updated_at: new Date(apiResponse.inquiry.updated_at),
        } : null,
    };
}
