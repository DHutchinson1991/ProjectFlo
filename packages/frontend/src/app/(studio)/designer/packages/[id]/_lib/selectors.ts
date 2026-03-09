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
    buildTaskHoursMap,
    getOperatorCrewName,
    getOperatorRoleName,
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

/**
 * Compute the total crew cost from a list of operators and an optional
 * task-auto-generation preview (for hours-per-role).
 *
 * This replaces the duplicated cost-reduction logic that appeared in:
 *   – The top-level "Total Cost Summary Card" IIFE
 *   – The "Crew Total" section inside the Crew card IIFE
 */
export function computeCrewCost(
    operators: PackageDayOperatorRecord[],
    taskPreview: TaskAutoGenerationPreview | null,
): number {
    const taskHoursMap = buildTaskHoursMap(taskPreview);
    return operators.reduce((sum, op) => {
        // Only count operators with a contributor or job role (real crew)
        if (!op.contributor_id && !op.job_role_id) return sum;

        if (isCrewDayRate(op)) {
            return sum + getCrewDayRate(op) * Number(op.hours || 1);
        }

        const crewName = getOperatorCrewName(op);
        const roleName = getOperatorRoleName(op);
        const taskKey = crewName && roleName ? `${crewName}|${roleName}` : null;
        const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
        const rate = getCrewHourlyRate(op);
        const hours = taskHours > 0 ? taskHours : Number(op.hours || 0);
        return sum + rate * hours;
    }, 0);
}

// ─── Equipment cost computation ─────────────────────────────────────

/** Minimal contents shape needed for equipment cost extraction. */
interface EquipContentsForCost {
    day_equipment?: Record<string, Array<{ equipment_id: number }>>;
}

/**
 * Compute the total equipment cost across all event days.
 *
 * Gathers unique equipment IDs from:
 *  1. The `day_equipment` JSON field on the package contents
 *  2. The relational operator→equipment links on each operator
 *
 * Then sums the `rental_price_per_day` from the full equipment inventory.
 */
export function computeEquipmentCost(
    contents: EquipContentsForCost | undefined | null,
    operators: PackageDayOperatorRecord[],
    allEquipment: EquipmentRecord[],
): number {
    const dayEquipMap = contents?.day_equipment || {};
    const allEquipIds = new Set<number>();

    // From day_equipment JSON
    Object.values(dayEquipMap).forEach(items => {
        (items || []).forEach(item => allEquipIds.add(item.equipment_id));
    });

    // From relational operator-equipment links
    operators.forEach(op => {
        (op.equipment || []).forEach(eq => allEquipIds.add(eq.equipment_id));
    });

    return Array.from(allEquipIds).reduce((sum, eqId) => {
        const fullEq = allEquipment.find(e => e.id === eqId);
        return sum + (fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0);
    }, 0);
}
