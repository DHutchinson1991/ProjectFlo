/**
 * User Domain Types — Canonical source.
 *
 * Cross-domain user/contact/crew types shared across features.
 */

import type { CrewJobRole as CrewJobRole } from '@/features/catalog/task-library/types/job-roles';

// ============================================================================
// DOMAIN MODELS
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
    full_name: string;
}

export interface Role {
    id: number;
    name: string;
    description?: string;
    brand_id?: number;
}

export interface Crew {
    id: number;
    contact_id: number;
    role_id: number;
    archived_at?: string | null;
    crew_color?: string | null;
    bio?: string | null;

    contact: Contact;
    role?: Role | null;
    job_role_assignments?: CrewJobRole[];

    email: string;
    first_name?: string;
    last_name?: string;
    full_name: string;
    initials: string;
}

// ============================================================================
// DTOs
// ============================================================================

export interface NewCrewData {
    email: string;
    first_name?: string;
    last_name?: string;
    password: string;
    role_id: number;
}

export interface UpdateCrewDto {
    email?: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    role_id?: number;
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
// LEGACY SUPPORT
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

// ============================================================================
// TEAM MANAGEMENT
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
}
