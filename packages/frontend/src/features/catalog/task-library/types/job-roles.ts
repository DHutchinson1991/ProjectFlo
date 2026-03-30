/**
 * Job Roles Types — Canonical source.
 */

export interface JobRole {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    _count?: {
        job_role_assignments: number;
    };
}

export interface CrewJobRole {
    id: number;
    crew_id: number;
    job_role_id: number;
    is_primary: boolean;
    payment_bracket_id?: number | null;
    created_at: string;
    updated_at: string;
    job_role: JobRole;
    payment_bracket?: {
        id: number;
        name: string;
        display_name?: string | null;
        level: number;
        hourly_rate: number;
        day_rate?: number | null;
        overtime_rate?: number | null;
        color?: string | null;
    } | null;
}

export interface CreateJobRoleData {
    name: string;
    display_name: string;
    description?: string;
    category?: string;
    is_active?: boolean;
}

export interface UpdateJobRoleData {
    name?: string;
    display_name?: string;
    description?: string;
    category?: string;
    is_active?: boolean;
}
