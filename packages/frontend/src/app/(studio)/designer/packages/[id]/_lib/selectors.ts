// ─── Package Edit Page – Derived Data Selectors ─────────────────────
//
// Pure selector functions that compute derived values from page state.
// Centralises logic that was previously duplicated across multiple
// IIFEs inside the JSX render tree.
// ─────────────────────────────────────────────────────────────────────

import type { TaskAutoGenerationPreview } from '@/lib/types/task-library';
import type { PackageDayOperatorRecord, EquipmentRecord } from './types';
import {
    getCrewHourlyRate,
    isCrewDayRate,
    getCrewDayRate,
} from './helpers';

// ─── Active day resolution ──────────────────────────────────────────

/**
 * Resolve the active event-day ID from the explicit selection or the
 * first available day. Centralises the repeated
 * `scheduleActiveDayId || packageEventDays[0]?.id` pattern.
 */
export function getActiveDayId(
    scheduleActiveDayId: number | null,
    packageEventDays: Array<{ id: number }>,
): number | undefined {
    return scheduleActiveDayId ?? packageEventDays[0]?.id ?? undefined;
}

// ─── Crew cost computation ──────────────────────────────────────────

const CREW_COST_EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

/**
 * Compute the total crew cost from a list of operators and an optional
 * task-auto-generation preview.
 *
 * When a preview is available we sum `estimated_cost` directly from the
 * backend-generated task rows (exactly what the TaskAutoGenCard displays),
 * which avoids the floating-point divergence caused by re-multiplying
 * aggregated hours in the frontend.  Day-rate operators are added on top
 * because the backend preview returns `estimated_cost = 0` for them
 * (their brackets carry a day_rate, not an hourly_rate).
 *
 * When no preview exists we fall back to operator-level rate × hours.
 */
export function computeCrewCost(
    operators: PackageDayOperatorRecord[],
    taskPreview: TaskAutoGenerationPreview | null,
): number {
    if (taskPreview?.tasks) {
        // Sum estimated_cost from all non-sales-pipeline task rows
        const taskCost = taskPreview.tasks
            .filter(t => !CREW_COST_EXCLUDED_PHASES.has(t.phase) && t.estimated_cost != null)
            .reduce((sum, t) => sum + (t.estimated_cost ?? 0), 0);

        // Day-rate crew have hourly_rate=0 in the preview so estimated_cost=0;
        // add their actual day-rate cost separately.
        const dayRateCost = operators
            .filter(op => isCrewDayRate(op))
            .reduce((sum, op) => sum + getCrewDayRate(op) * Number(op.hours || 1), 0);

        return taskCost + dayRateCost;
    }

    // Fallback: no preview available — compute directly from operator rates
    return operators.reduce((sum, op) => {
        if (!op.contributor_id && !op.job_role_id) return sum;
        if (isCrewDayRate(op)) {
            return sum + getCrewDayRate(op) * Number(op.hours || 1);
        }
        const rate = getCrewHourlyRate(op);
        const hours = Number(op.hours || 0);
        return sum + rate * hours;
    }, 0);
}

// ─── Equipment cost computation ─────────────────────────────────────

/** Minimal contents shape needed for equipment cost extraction. */
interface EquipContentsForCost {
    day_equipment?: Record<string, Array<{ equipment_id: number }>>;
}

/**
 * Compute the total equipment cost from operator-linked equipment only.
 *
 * Uses only the relational operator→equipment links, matching the backend
 * `estimatePackagePrice` behaviour. The `day_equipment` JSON field is
 * intentionally excluded — it can contain orphaned entries from deleted
 * event days that are invisible in the UI but would inflate the total.
 *
 * Deduplicates by equipment_id (shared equipment counted once).
 */
export function computeEquipmentCost(
    _contents: EquipContentsForCost | undefined | null,
    operators: PackageDayOperatorRecord[],
    allEquipment: EquipmentRecord[],
): number {
    const allEquipIds = new Set<number>();

    // Only relational operator-equipment links (matches backend behaviour)
    operators.forEach(op => {
        (op.equipment || []).forEach(eq => allEquipIds.add(eq.equipment_id));
    });

    return Array.from(allEquipIds).reduce((sum, eqId) => {
        const fullEq = allEquipment.find(e => e.id === eqId);
        return sum + (fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0);
    }, 0);
}
