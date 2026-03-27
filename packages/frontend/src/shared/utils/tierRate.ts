/** Tier display labels keyed by bracket level */
export const TIER_LABELS: Record<number, string> = {
    1: 'Junior',
    2: 'Mid-Level',
    3: 'Senior',
    4: 'Lead',
    5: 'Executive',
};

/** Tier display colors keyed by bracket level */
export const TIER_COLORS: Record<number, string> = {
    1: 'rgba(100, 200, 255, 0.85)',
    2: 'rgba(160, 140, 255, 0.85)',
    3: 'rgba(255, 180, 100, 0.85)',
    4: 'rgba(255, 100, 130, 0.85)',
    5: 'rgba(255, 80, 200, 0.85)',
};

/** Minimal shape needed to resolve the highest bracket */
export interface BracketMapping {
    job_role_id: number;
    skill_name: string;
    payment_bracket?: { level?: number | null; name: string; hourly_rate: number; day_rate?: number | null } | null;
}

/**
 * Given a role ID, an optional list of skill names, and all skill→role mappings,
 * returns the payment bracket with the highest level (or null).
 * If skills is omitted or empty, matches all mappings for the role.
 */
export function resolveHighestBracket<T extends BracketMapping>(
    roleId: number | null | undefined,
    allMappings: T[],
    skills?: string[],
): T['payment_bracket'] | null {
    if (!roleId) return null;

    let highest: T['payment_bracket'] | null = null;
    for (const m of allMappings) {
        if (m.job_role_id !== roleId) continue;
        if (skills && skills.length > 0 && !skills.includes(m.skill_name)) continue;
        if (!m.payment_bracket) continue;
        if (!highest || (m.payment_bracket.level ?? 0) > (highest.level ?? 0)) {
            highest = m.payment_bracket;
        }
    }
    return highest;
}
