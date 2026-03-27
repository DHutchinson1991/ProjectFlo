export interface PaymentBracket {
    id: number;
    job_role_id: number;
    name: string;
    display_name?: string | null;
    level: number;
    hourly_rate: number;
    day_rate?: number | null;
    overtime_rate?: number | null;
    description?: string | null;
    color?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    job_role?: {
        id: number;
        name: string;
        display_name?: string | null;
        category?: string | null;
    };
    _count?: {
        job_role_assignments: number;
    };
    /** Populated when fetching brackets by-role (includes assigned crew) */
    job_role_assignments?: BracketCrewMemberAssignment[];
}

/** A contributor assigned to a specific payment bracket (returned within bracket data) */
export interface BracketCrewMemberAssignment {
    id: number;
    crew_member_id: number;
    job_role_id: number;
    is_primary: boolean;
    is_unmanned: boolean;
    crew_member: {
        id: number;
        crew_color?: string | null;
        contact: {
            first_name?: string | null;
            last_name?: string | null;
            email: string;
        };
    };
}

export interface PaymentBracketsByRole {
    [roleName: string]: {
        job_role: {
            id: number;
            name: string;
            display_name?: string | null;
            category?: string | null;
        };
        brackets: PaymentBracket[];
    };
}

export interface EffectiveRate {
    crew_member_id: number;
    job_role: {
        id: number;
        name: string;
        display_name?: string | null;
    };
    payment_bracket: PaymentBracket | null;
    effective_hourly_rate: number | null;
    rate_source: "payment_bracket" | "none";
}

export interface CrewMemberBracketAssignment {
    id: number;
    crew_member_id: number;
    job_role_id: number;
    is_primary: boolean;
    payment_bracket_id: number | null;
    job_role: {
        id: number;
        name: string;
        display_name?: string | null;
        category?: string | null;
    };
    payment_bracket: PaymentBracket | null;
}

export interface CreatePaymentBracketData {
    job_role_id: number;
    name: string;
    display_name?: string;
    level: number;
    hourly_rate: number;
    day_rate?: number;
    overtime_rate?: number;
    description?: string;
    color?: string;
    is_active?: boolean;
}

export interface UpdatePaymentBracketData {
    name?: string;
    display_name?: string;
    level?: number;
    hourly_rate?: number;
    day_rate?: number;
    overtime_rate?: number;
    description?: string;
    color?: string;
    is_active?: boolean;
}

export interface AssignBracketData {
    crew_member_id: number;
    job_role_id: number;
    payment_bracket_id: number;
}
