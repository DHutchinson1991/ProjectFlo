/**
 * User API Responses
 * 
 * Types representing the exact structure returned by backend APIs for user-related endpoints.
 * These should match the backend response format exactly.
 */

// ============================================================================
// BACKEND API RESPONSE STRUCTURES
// ============================================================================

export interface ContributorApiResponse {
    id: number;
    contact_id: number;
    role_id: number;
    contributor_type?: string;
    password_hash?: string;
    archived_at?: string | null;
    default_hourly_rate?: string | number; // Backend returns Decimal as string
    contact: ContactApiResponse;
    role: RoleApiResponse;
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

// ============================================================================
// API COLLECTION RESPONSES
// ============================================================================

export type ContributorsListResponse = ContributorApiResponse[];

export type ContactsListResponse = ContactApiResponse[];

export type RolesListResponse = RoleApiResponse[];

// ============================================================================
// API ERROR RESPONSES
// ============================================================================

export interface ApiErrorResponse {
    message: string;
    error?: string;
    statusCode: number;
    timestamp?: string;
    path?: string;
}
