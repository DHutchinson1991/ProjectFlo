// ─── Package Edit Page – Pure Helper Functions ──────────────────────
//
// Stateless, side-effect-free business logic extracted from page.tsx.
// Every function here is independently testable.
// ─────────────────────────────────────────────────────────────────────

import type { TaskAutoGenerationPreview } from '@/lib/types/task-library';
import type { PackageDayOperatorRecord, FilmData } from '../types';

// ─── Crew rate helpers ───────────────────────────────────────────────

/**
 * Resolve the effective hourly rate for a crew operator:
 *  1. Payment bracket rate matching the operator's job_role (best)
 *  2. Any payment bracket rate on the contributor (fallback)
 *  3. Contributor's default_hourly_rate
 *  Returns 0 if nothing is set.
 */
export function getCrewHourlyRate(op: PackageDayOperatorRecord): number {
    const c = op.contributor;
    if (!c) return 0;
    const roles = c.contributor_job_roles || [];
    // Try to find the bracket matching the operator's assigned job_role first
    if (op.job_role_id) {
        const match = roles.find(r => r.job_role_id === op.job_role_id && r.payment_bracket?.hourly_rate);
        if (match?.payment_bracket?.hourly_rate) return Number(match.payment_bracket.hourly_rate);
    }
    // Fallback: primary role bracket
    const primary = roles.find(r => r.is_primary && r.payment_bracket?.hourly_rate);
    if (primary?.payment_bracket?.hourly_rate) return Number(primary.payment_bracket.hourly_rate);
    // Fallback: any bracket
    const anyRole = roles.find(r => r.payment_bracket?.hourly_rate);
    if (anyRole?.payment_bracket?.hourly_rate) return Number(anyRole.payment_bracket.hourly_rate);
    // Fallback: contributor default
    if (c.default_hourly_rate) return Number(c.default_hourly_rate);
    return 0;
}

/**
 * Check if an operator is a day-rate role (has day_rate but no hourly_rate
 * on the matching bracket). These roles (e.g. Production) are costed per day,
 * not per hour.
 */
export function isCrewDayRate(op: PackageDayOperatorRecord): boolean {
    const c = op.contributor;
    if (!c) return false;
    const roles = c.contributor_job_roles || [];
    if (op.job_role_id) {
        const match = roles.find((r) => r.job_role_id === op.job_role_id);
        if (match?.payment_bracket) {
            const dayRate = Number(match.payment_bracket.day_rate || 0);
            const hourlyRate = Number(match.payment_bracket.hourly_rate || 0);
            return dayRate > 0 && hourlyRate === 0;
        }
    }
    return false;
}

/**
 * Get the day rate for a day-rate operator. Returns 0 if not found.
 */
export function getCrewDayRate(op: PackageDayOperatorRecord): number {
    const c = op.contributor;
    if (!c) return 0;
    const roles = c.contributor_job_roles || [];
    if (op.job_role_id) {
        const match = roles.find((r) => r.job_role_id === op.job_role_id && r.payment_bracket?.day_rate);
        if (match?.payment_bracket?.day_rate) return Number(match.payment_bracket.day_rate);
    }
    // Fallback: primary role bracket
    const primary = roles.find((r) => r.is_primary && r.payment_bracket?.day_rate);
    if (primary?.payment_bracket?.day_rate) return Number(primary.payment_bracket.day_rate);
    return 0;
}

// ─── Task hours helpers ──────────────────────────────────────────────

/**
 * Build a map of (crewName|roleName) → total task hours from the
 * auto-generation preview. Used to display hours-per-role in the crew card
 * and compute hourly-based crew costs.
 *
 * Excludes sales-pipeline phases (Lead, Inquiry, Booking) so crew costs
 * reflect only project-delivery work.
 */
const EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

export function buildTaskHoursMap(preview: TaskAutoGenerationPreview | null): Map<string, number> {
    const map = new Map<string, number>();
    if (!preview?.tasks) return map;
    for (const task of preview.tasks) {
        if (!task.assigned_to_name || !task.role_name) continue;
        if (EXCLUDED_PHASES.has(task.phase)) continue;
        const key = `${task.assigned_to_name}|${task.role_name}`;
        map.set(key, (map.get(key) || 0) + task.total_hours);
    }
    return map;
}

// ─── Film stats helpers ──────────────────────────────────────────────

export interface FilmStats {
    realtime: number;
    montage: number;
    totalDuration: string;
}

/**
 * Compute stats for a film: number of realtime/montage scenes and total
 * formatted duration. Pure function — receives the films array rather than
 * closing over component state.
 */
export function getFilmStats(films: FilmData[], filmId: number): FilmStats {
    const film = films.find(f => f.id === filmId);
    if (!film?.scenes) return { realtime: 0, montage: 0, totalDuration: '0:00' };

    const realtime = film.scenes.filter((s) => s.mode === 'MOMENTS' || !s.mode).length;
    const montage = film.scenes.filter((s) => s.mode === 'MONTAGE').length;

    // Calculate total duration from beats and moments within scenes
    let totalSeconds = 0;
    for (const scene of film.scenes) {
        // First try scene-level duration
        if (scene.duration_seconds) {
            totalSeconds += scene.duration_seconds;
            continue;
        }
        // Then try summing beats
        if (Array.isArray(scene.beats) && scene.beats.length > 0) {
            totalSeconds += scene.beats.reduce((sum, b) => sum + (b.duration_seconds || 0), 0);
            continue;
        }
        // Then try summing moments
        if (scene.moments?.length) {
            totalSeconds += scene.moments.reduce((sum, m) => sum + (m.duration || 0), 0);
        }
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const totalDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return { realtime, montage, totalDuration };
}

// ─── Crew display helpers ────────────────────────────────────────────

/**
 * Get the display name for a crew operator from their contributor contact.
 * Returns empty string if no contributor.
 */
export function getOperatorCrewName(op: PackageDayOperatorRecord): string {
    if (!op.contributor) return '';
    return `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim();
}

/**
 * Get the display name for an operator's job role.
 * Returns null if no job role is set.
 */
export function getOperatorRoleName(op: PackageDayOperatorRecord): string | null {
    if (!op.job_role) return null;
    return op.job_role.display_name || op.job_role.name;
}

/**
 * Build the task hours map key for a given operator.
 * Returns null if either crew name or role name is missing.
 */
export function getOperatorTaskKey(op: PackageDayOperatorRecord): string | null {
    const crewName = getOperatorCrewName(op);
    const roleName = getOperatorRoleName(op);
    return crewName && roleName ? `${crewName}|${roleName}` : null;
}

/**
 * Get the tier/payment-bracket name for an operator, if available.
 */
export function getOperatorTierName(op: PackageDayOperatorRecord): string | null {
    if (!op.contributor || !op.job_role) return null;
    const jobRoleMatch = op.contributor.contributor_job_roles?.find(
        (cjr) => cjr.job_role_id === op.job_role_id,
    );
    return jobRoleMatch?.payment_bracket?.name || null;
}
