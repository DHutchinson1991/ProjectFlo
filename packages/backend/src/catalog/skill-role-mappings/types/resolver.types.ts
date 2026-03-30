export interface ResolvedRoleResult {
    job_role_id: number;
    job_role_name: string;
    job_role_display_name: string | null;
    bracket_id: number | null;
    bracket_name: string | null;
    bracket_level: number | null;
    hourly_rate: number | null;
    day_rate: number | null;
    resolved_skill: string;
}

import type { Decimal } from '@prisma/client/runtime/library';

type RateValue = Decimal | number | null;

export type MappingEntry = {
    job_role_id: number;
    skill_name: string;
    priority: number;
    brand_id: number | null;
    payment_bracket_id: number | null;
    job_role: { id: number; name: string; display_name: string | null; category: string | null };
    payment_bracket: { id: number; name: string; level: number; hourly_rate: RateValue; day_rate: RateValue } | null;
};

export interface ScoredRole {
    roleId: number;
    role: MappingEntry['job_role'];
    resolvedBracket: { id: number; name: string; level: number; hourly_rate: RateValue; day_rate: RateValue } | null;
    resolvedSkill: string;
    needsFallbackBracket: boolean;
}
