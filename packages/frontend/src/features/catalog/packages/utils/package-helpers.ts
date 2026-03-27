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

/** Resolve the effective hourly rate for a crew operator. */
export function getCrewHourlyRate(op: PackageCrewSlotRecord): number {
    return resolveHourlyRate(op);
}

/** Check if an operator is a day-rate role. */
export function isCrewDayRate(op: PackageCrewSlotRecord): boolean {
    return usesDayRate(op);
}

/** Get the day rate for a day-rate operator. Returns 0 if not found. */
export function getCrewDayRate(op: PackageCrewSlotRecord): number {
    return resolveDayRate(op);
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
export function getOperatorCrewName(op: PackageCrewSlotRecord): string {
    if (!op.crew_member) return '';
    return `${op.crew_member.contact?.first_name || ''} ${op.crew_member.contact?.last_name || ''}`.trim();
}

/**
 * Get the display name for an operator's job role.
 * Returns null if no job role is set.
 */
export function getOperatorRoleName(op: PackageCrewSlotRecord): string | null {
    if (!op.job_role) return null;
    return op.job_role.display_name || op.job_role.name;
}

/**
 * Build the task hours map key for a given operator.
 * Returns null if either crew name or role name is missing.
 */
export function getOperatorTaskKey(op: PackageCrewSlotRecord): string | null {
    const crewName = getOperatorCrewName(op);
    const roleName = getOperatorRoleName(op);
    return crewName && roleName ? `${crewName}|${roleName}` : null;
}

/**
 * Get the tier/payment-bracket name for an operator, if available.
 */
export function getOperatorTierName(op: PackageCrewSlotRecord): string | null {
    if (!op.crew_member || !op.job_role) return null;
    const jobRoleMatch = op.crew_member.job_role_assignments?.find(
        (cjr) => cjr.job_role_id === op.job_role_id,
    );
    return jobRoleMatch?.payment_bracket?.name || null;
}
