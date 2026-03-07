/**
 * User Domain Types
 * 
 * Frontend domain models for user-related entities.
 * These represent how we want to work with user data in our application.
 */

import { ContributorJobRole } from '../job-roles';

// ============================================================================
// DOMAIN MODELS (Frontend-friendly interfaces)
// ============================================================================

export interface Contact {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    company_name?: string;
    type?: string;
    brand_id?: number;
    archived_at?: string | null;

    // Computed properties for convenience
    full_name: string;
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    brand_id?: number;
}

export interface Contributor {
    id: number;
    contact_id: number;
    role_id: number;
    contributor_type?: string;
    default_hourly_rate?: number; // Always normalized to number in domain model
    archived_at?: string | null;
    is_crew?: boolean;
    crew_color?: string | null;
    bio?: string | null;

    // Related entities
    contact: Contact;
    role?: Role | null;
    contributor_job_roles?: ContributorJobRole[];

    // Computed properties for convenience
    email: string;
    first_name?: string;
    last_name?: string;
    full_name: string;
    initials: string;
}

// ============================================================================
// DATA TRANSFER OBJECTS (For API calls)
// ============================================================================

export interface NewContributorData {
    email: string;
    first_name?: string;
    last_name?: string;
    password: string;
    role_id: number;
    contributor_type?: string;
    default_hourly_rate?: number;
}

export interface UpdateContributorDto {
    email?: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    role_id?: number;
    contributor_type?: string;
    default_hourly_rate?: number;
}

export interface NewContactData {
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    company_name?: string;
    type?: string;
    brand_id?: number;
}

export interface UpdateContactDto {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    company_name?: string;
    type?: string;
    brand_id?: number;
}

// ============================================================================
// LEGACY SUPPORT (Deprecated - use domain models above)
// ============================================================================

/** @deprecated Use Contact instead */
export interface ContactData {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    company_name?: string;
    type?: string;
}

/** @deprecated Use Contributor instead */
export interface ContributorData {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: {
        id: number;
        name: string;
    };
    contributor_type?: string;
    default_hourly_rate?: number;
}

// ============================================================================
// TEAM MANAGEMENT (Future expansion)
// ============================================================================

export interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive" | "pending";
    avatar?: string;
}

export interface Team {
    id: number;
    name: string;
    description?: string;
    members: TeamMember[];
    createdAt: string;
}
