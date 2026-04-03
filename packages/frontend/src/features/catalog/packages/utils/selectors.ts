// ─── Package Edit Page – Derived Data Selectors ─────────────────────
//
// Pure selector functions that compute derived values from page state.
// Delegates to @projectflo/shared for all pricing math to ensure
// frontend and backend always agree.
// ─────────────────────────────────────────────────────────────────────

import type { TaskAutoGenerationPreview } from '@/features/catalog/task-library/types';
import type { PackageCrewSlotRecord, EquipmentRecord } from '../types';
import { NON_DELIVERY_PHASES } from '@/shared/utils/rates';
import {
    computeEquipmentBreakdown,
    computeTaskCostBreakdown,
    computeCrewCost as sharedComputeCrewCost,
} from '@/shared/utils/pricing';

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
 * Compute the total crew cost from a list of crew slots and an optional
 * task-auto-generation preview.
 *
 * Delegates to @projectflo/shared `computeCrewCost` which uses
 * `estimated_cost` directly from task rows and adds day-rate crew
 * adjustments. This ensures the frontend matches the backend
 * PricingService exactly.
 */
export function computeCrewCost(
    crewSlots: PackageCrewSlotRecord[],
    taskPreview: TaskAutoGenerationPreview | null,
): number {
    if (taskPreview?.tasks) {
        // Filter to delivery-only tasks and sum estimated_cost
        const deliveryTasks = taskPreview.tasks.filter(
            t => !NON_DELIVERY_PHASES.has(t.phase),
        );
        const taskCost = deliveryTasks.reduce(
            (sum, t) => sum + (t.estimated_cost ?? 0),
            0,
        );
        return sharedComputeCrewCost(taskCost, crewSlots);
    }

    // No preview — fallback uses shared function with null taskCost
    return sharedComputeCrewCost(null, crewSlots);
}

// ─── Equipment cost computation ─────────────────────────────────────

/**
 * Compute the total equipment cost from crew-slot-linked equipment only.
 *
 * Delegates to @projectflo/shared `computeEquipmentBreakdown` which
 * deduplicates by equipment_id and sums rental_price_per_day.
 * This ensures the frontend matches the backend PricingService exactly.
 */
export function computeEquipmentCost(
    _contents: { day_equipment?: Record<string, Array<{ equipment_id: number }>> } | undefined | null,
    crewSlots: PackageCrewSlotRecord[],
    _allEquipment: EquipmentRecord[],
): number {
    return computeEquipmentBreakdown(crewSlots as unknown as Parameters<typeof computeEquipmentBreakdown>[0]).dailyCost;
}
