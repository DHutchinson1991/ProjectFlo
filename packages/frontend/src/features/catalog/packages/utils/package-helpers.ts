// ─── Package Edit Page – Pure Helper Functions ──────────────────────
//
// Stateless, side-effect-free business logic extracted from page.tsx.
// Every function here is independently testable.
// ─────────────────────────────────────────────────────────────────────

import type { TaskAutoGenerationPreview } from '@/features/catalog/task-library/types';
import type { PackageCrewSlotRecord, FilmData } from '../types';
import {
    resolveHourlyRate,
    resolveDayRate,
    usesDayRate,
    NON_DELIVERY_PHASES,
} from '@/shared/utils/rates';

// ─── Crew rate helpers (delegates to @projectflo/shared) ─────────────

/** Resolve the effective hourly rate for a crew slot. */
export function getCrewHourlyRate(op: PackageCrewSlotRecord): number {
    return resolveHourlyRate(op);
}

/** Check if a crew slot is a day-rate role. */
export function isCrewDayRate(op: PackageCrewSlotRecord): boolean {
    return usesDayRate(op);
}

/** Get the day rate for a day-rate crew slot. Returns 0 if not found. */
export function getCrewDayRate(op: PackageCrewSlotRecord): number {
    return resolveDayRate(op);
}

/**
 * Compute the on-site cost for a crew slot using the billing band thresholds.
 * Returns null when the bracket doesn't have day_rate configured.
 */
export function resolveOnsiteCost(
    op: PackageCrewSlotRecord,
    onsiteHours: number,
    halfDayMaxHours: number,
    fullDayMaxHours: number,
): number | null {
    const match = op.crew?.job_role_assignments?.find(r => r.job_role_id === op.job_role_id);
    const bracket = match?.payment_bracket;
    if (!bracket) return null;
    const dayRate = Number(bracket.day_rate || 0);
    if (dayRate === 0) return null;
    const halfDayRate = Number(bracket.half_day_rate || 0) || dayRate / 2;
    const overtimeRate = Number(bracket.overtime_rate || 0);
    if (onsiteHours < halfDayMaxHours) return halfDayRate;
    if (onsiteHours < fullDayMaxHours) return dayRate;
    const overage = onsiteHours - fullDayMaxHours;
    return dayRate + overtimeRate * overage;
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
export function buildTaskHoursMap(preview: TaskAutoGenerationPreview | null): Map<string, number> {
    const map = new Map<string, number>();
    if (!preview?.tasks) return map;
    for (const task of preview.tasks) {
        if (!task.assigned_to_name || !task.role_name) continue;
        if (NON_DELIVERY_PHASES.has(task.phase)) continue;
        const key = `${task.assigned_to_name}|${task.role_name}`;
        map.set(key, (map.get(key) || 0) + task.total_hours);
    }
    return map;
}

/**
 * Build a map of (crewName|roleName) → total on-site hours from the
 * auto-generation preview. Deduplicates by activity_key so each unique
 * activity is counted only once per crew member, matching the backend
 * billing logic.
 */
export function buildOnsiteHoursMap(preview: TaskAutoGenerationPreview | null): Map<string, number> {
    // Keyed by person name only — all on-site roles for the same crew member are
    // aggregated into one total. A person on-site covers ONE unit of time regardless
    // of how many roles they fill. activity_key deduplicates the same physical event
    // across all role-specific tasks (e.g. Video Coverage + Audio Coverage for Ceremony
    // both share activity_key = "Ceremony" → counted once).
    const perCrew = new Map<string, Map<string, number>>();
    if (!preview?.tasks) return new Map();
    for (const task of preview.tasks) {
        if (!task.is_on_site || !task.assigned_to_name || !task.role_name) continue;
        if (NON_DELIVERY_PHASES.has(task.phase)) continue;
        const crewKey = task.assigned_to_name; // person-level, not person+role
        if (!perCrew.has(crewKey)) perCrew.set(crewKey, new Map());
        const actMap = perCrew.get(crewKey)!;
        // activity_key deduplicates the same activity across roles;
        // for non-activity tasks, include role to avoid cross-role collapse
        const dedupeKey = task.activity_key ?? `__task_${task.role_name}_${task.name}`;
        if (!actMap.has(dedupeKey)) {
            actMap.set(dedupeKey, task.total_hours);
        }
    }
    const result = new Map<string, number>();
    for (const [crewKey, actMap] of perCrew) {
        const totalHours = Array.from(actMap.values()).reduce((s, h) => s + h, 0);
        result.set(crewKey, totalHours);
    }
    return result;
}

/**
 * Returns the set of `name|role` keys for which at least one on-site task
 * exists. Used by CrewCard to classify individual ops as on-site (vs just
 * sharing a crew name with someone who has on-site tasks).
 */
export function buildOnsiteRoleSet(preview: TaskAutoGenerationPreview | null): Set<string> {
    const result = new Set<string>();
    if (!preview?.tasks) return result;
    for (const task of preview.tasks) {
        if (!task.is_on_site || !task.assigned_to_name || !task.role_name) continue;
        if (NON_DELIVERY_PHASES.has(task.phase)) continue;
        result.add(`${task.assigned_to_name}|${task.role_name}`);
    }
    return result;
}

/**
 * Build a map of (crewName|roleName) → on-site task hours only.
 * Used together with buildTaskHoursMap to derive off-site hours for roles
 * that have both on-site and off-site tasks (off-site = total - onsite).
 */
export function buildOnsiteRoleHoursMap(preview: TaskAutoGenerationPreview | null): Map<string, number> {
    const map = new Map<string, number>();
    if (!preview?.tasks) return map;
    for (const task of preview.tasks) {
        if (!task.is_on_site || !task.assigned_to_name || !task.role_name) continue;
        if (NON_DELIVERY_PHASES.has(task.phase)) continue;
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
 * Get the display name for a crew slot from their crew contact.
 * Returns empty string if no crew.
 */
export function getCrewSlotCrewName(op: PackageCrewSlotRecord): string {
    if (!op.crew) return '';
    return `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim();
}

/**
 * Get the display name for a crew slot's job role.
 * Returns null if no job role is set.
 */
export function getCrewSlotRoleName(op: PackageCrewSlotRecord): string | null {
    if (!op.job_role) return null;
    return op.job_role.display_name || op.job_role.name;
}

/**
 * Build the task hours map key for a given crew slot.
 * Returns null if either crew name or role name is missing.
 */
export function getCrewSlotTaskKey(op: PackageCrewSlotRecord): string | null {
    const crewName = getCrewSlotCrewName(op);
    const roleName = getCrewSlotRoleName(op);
    return crewName && roleName ? `${crewName}|${roleName}` : null;
}

/**
 * Get the tier/payment-bracket name for a crew slot, if available.
 */
export function getCrewSlotTierName(op: PackageCrewSlotRecord): string | null {
    if (!op.crew || !op.job_role) return null;
    const jobRoleMatch = op.crew.job_role_assignments?.find(
        (cjr) => cjr.job_role_id === op.job_role_id,
    );
    return jobRoleMatch?.payment_bracket?.name || null;
}
