/**
 * User API Responses — Canonical source.
 *
 * Types representing the exact structure returned by backend APIs for user-related endpoints.
 */

export interface CrewMemberApiResponse {
    id: number;
    contact_id: number;
    role_id: number;
    password_hash?: string;
    archived_at?: string | null;
    crew_color?: string | null;
    bio?: string | null;
    contact: ContactApiResponse;
    role: RoleApiResponse;
    job_role_assignments?: CrewMemberJobRoleApiResponse[];
}

export interface CrewMemberJobRoleApiResponse {
    id: number;
    crew_member_id: number;
    job_role_id: number;
    is_primary: boolean;
    payment_bracket_id?: number | null;
    assigned_at: string;
    assigned_by?: number | null;
    job_role: JobRoleApiResponse;
    payment_bracket?: {
        id: number;
        name: string;
        display_name?: string | null;
        level: number;
        hourly_rate: number | string;
        day_rate?: number | string | null;
        overtime_rate?: number | string | null;
        color?: string | null;
    } | null;
}

export interface JobRoleApiResponse {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContactApiResponse {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    phone_number?: string | null;
    company_name?: string | null;
    type: string;
    brand_id?: number | null;
    archived_at?: string | null;
}

export interface RoleApiResponse {
    id: number;
    name: string;
    description?: string;
    brand_id?: number;
}

export type ContributorsListResponse = CrewMemberApiResponse[];
export type ContactsListResponse = ContactApiResponse[];
export type RolesListResponse = RoleApiResponse[];

export interface ApiErrorResponse {
    message: string;
    error?: string;
    statusCode: number;
    timestamp?: string;
    path?: string;
}
