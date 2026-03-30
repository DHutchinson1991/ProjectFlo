/**
 * @projectflo/shared — Pricing utilities
 *
 * THE single source of truth for all financial arithmetic.
 * Both packages/backend and packages/frontend import from here.
 * Pure functions only — no framework, DB, or runtime dependencies.
 */

import { resolveHourlyRate, resolveDayRate, usesDayRate } from './rates';
import type { RateResolvable } from './rates';

/**
 * A value that can be converted to a number via `Number()`.
 * Accepts primitives and Prisma Decimal (which has `toString()`).
 */
export type Numeric = number | string | { toString(): string } | null;

// ── Core arithmetic ─────────────────────────────────────────────────

/**
 * Round a number to 2 decimal places (cents).
 * Uses banker-friendly Math.round (rounds 0.5 up).
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compute the total for a single line item: quantity × unit_price, rounded.
 * Accepts number or string (form inputs often arrive as strings).
 */
export function computeLineTotal(
  quantity: number | string,
  unitPrice: number | string,
): number {
  return roundMoney(Number(quantity) * Number(unitPrice));
}

/**
 * Compute the pre-tax subtotal from an array of line items.
 * Each item is individually rounded before summing to avoid floating-point drift.
 */
export function computeItemsTotal(
  items: ReadonlyArray<{ quantity: number | string; unit_price: number | string }>,
): number {
  return items.reduce(
    (sum, item) => sum + computeLineTotal(item.quantity, item.unit_price),
    0,
  );
}

/**
 * Compute tax breakdown from a pre-tax subtotal and a tax rate percentage.
 *
 * @param subtotal - pre-tax amount (sum of line totals)
 * @param taxRate  - tax rate as a percentage (e.g. 20 for 20%)
 * @returns taxRate, taxAmount (rounded), total (rounded)
 */
export function computeTaxBreakdown(
  subtotal: number,
  taxRate: number,
): { taxRate: number; taxAmount: number; total: number } {
  const taxAmount = roundMoney(subtotal * (taxRate / 100));
  return { taxRate, taxAmount, total: roundMoney(subtotal + taxAmount) };
}

// ── Package pricing (equipment + crew/tasks) ────────────────────────

/** Phases excluded from delivery-cost pricing (sales pipeline only). */
const PRICING_EXCLUDED_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

// ── Equipment breakdown ─────────────────────────────────────────────

/** Minimal equipment shape from a crew-slot relation. */
export interface PricingEquipmentRel {
  equipment_id: number;
  equipment: {
    id?: number;
    item_name: string;
    category: string | null;
    rental_price_per_day: Numeric;
  };
}

/** Crew slot shape needed for equipment cost computation. */
export interface PricingCrewSlotForEquipment {
  equipment: ReadonlyArray<PricingEquipmentRel>;
}

export interface EquipmentBreakdown {
  cameras: number;
  audio: number;
  totalItems: number;
  dailyCost: number;
  items: Array<{ name: string; category: string; dailyRate: number }>;
}

/**
 * Compute equipment breakdown from crew-slot-linked equipment.
 * Deduplicates by equipment_id (shared equipment counted once).
 * Matches the backend PricingService.calculateEquipment() logic exactly.
 */
export function computeEquipmentBreakdown(
  crewSlots: ReadonlyArray<PricingCrewSlotForEquipment>,
): EquipmentBreakdown {
  let cameras = 0;
  let audio = 0;
  let totalCost = 0;
  const seen = new Set<number>();
  const items: EquipmentBreakdown['items'] = [];

  for (const slot of crewSlots) {
    for (const eq of slot.equipment) {
      if (eq.equipment.category === 'CAMERA') cameras++;
      else if (eq.equipment.category === 'AUDIO') audio++;
      if (!seen.has(eq.equipment_id)) {
        seen.add(eq.equipment_id);
        const dailyRate = Number(eq.equipment.rental_price_per_day || 0);
        totalCost += dailyRate;
        items.push({
          name: eq.equipment.item_name,
          category: String(eq.equipment.category),
          dailyRate,
        });
      }
    }
  }
  return {
    cameras,
    audio,
    totalItems: seen.size,
    dailyCost: roundMoney(totalCost),
    items,
  };
}

// ── Task cost aggregation ───────────────────────────────────────────

/** Minimal task row shape for cost aggregation from auto-generation preview. */
export interface PricingTaskRow {
  phase: string;
  total_instances: number;
  total_hours: number;
  estimated_cost: number | null;
}

export interface TaskCostBreakdown {
  totalTasks: number;
  totalHours: number;
  totalCost: number;
  byPhase: Record<string, { taskCount: number; hours: number; cost: number }>;
}

/**
 * Aggregate task costs from auto-generation preview rows.
 * Excludes non-delivery phases (Lead, Inquiry, Booking).
 */
export function computeTaskCostBreakdown(
  tasks: ReadonlyArray<PricingTaskRow>,
): TaskCostBreakdown {
  const production = tasks.filter(
    (t) => !PRICING_EXCLUDED_PHASES.has(t.phase),
  );

  const totalTasks = production.reduce((s, t) => s + t.total_instances, 0);
  const totalHours = production.reduce((s, t) => s + t.total_hours, 0);
  const totalCost = production.reduce(
    (s, t) => s + (t.estimated_cost ?? 0),
    0,
  );

  const byPhase: TaskCostBreakdown['byPhase'] = {};
  for (const t of production) {
    const phase = t.phase;
    if (!byPhase[phase]) {
      byPhase[phase] = { taskCount: 0, hours: 0, cost: 0 };
    }
    byPhase[phase].taskCount += t.total_instances;
    byPhase[phase].hours += t.total_hours;
    byPhase[phase].cost += t.estimated_cost ?? 0;
  }
  // Round phase-level values
  for (const phase of Object.keys(byPhase)) {
    byPhase[phase].hours = roundMoney(byPhase[phase].hours);
    byPhase[phase].cost = roundMoney(byPhase[phase].cost);
  }

  return { totalTasks, totalHours, totalCost, byPhase };
}

// ── Crew cost (from task preview + day-rate adjustment) ─────────────

/** Crew slot shape needed for day-rate cost computation. */
export interface PricingCrewSlotForDayRate extends RateResolvable {
  hours?: Numeric;
  crew_id?: number | null;
}

/**
 * Compute crew cost from a task auto-generation preview.
 *
 * Uses `estimated_cost` directly from tasks (avoids re-multiplying
 * aggregated hours in a consumer and getting rounding drift).
 *
 * Day-rate crew are added separately because the task preview returns
 * `estimated_cost = 0` for them (their brackets carry day_rate, not hourly_rate).
 *
 * When no task preview is available, falls back to crew-slot-level
 * rate × hours computation.
 */
export function computeCrewCost(
  taskTotalCost: number | null,
  crewSlots: ReadonlyArray<PricingCrewSlotForDayRate>,
): number {
  if (taskTotalCost != null) {
    // Add day-rate crew cost separately since task preview returns 0 for them
    const dayRateCost = crewSlots
      .filter((op) => usesDayRate(op))
      .reduce(
        (sum, op) =>
          sum + roundMoney(resolveDayRate(op) * Number(op.hours || 1)),
        0,
      );
    return roundMoney(taskTotalCost + dayRateCost);
  }

  // Fallback: no task preview — compute directly from crew slot rates
  return crewSlots.reduce((sum, op) => {
    if (!op.crew_id && !op.job_role_id) return sum;
    if (usesDayRate(op)) {
      return sum + roundMoney(resolveDayRate(op) * Number(op.hours || 1));
    }
    const rate = resolveHourlyRate(op);
    const hours = Number(op.hours || 0);
    return sum + roundMoney(rate * hours);
  }, 0);
}

// ── Full package pricing summary ────────────────────────────────────

export interface PackagePricingSummary {
  equipmentCost: number;
  crewCost: number;
  subtotal: number;
  tax: { rate: number; amount: number; totalWithTax: number };
}

/**
 * Compute the full package pricing summary from pre-computed components.
 * This is the canonical formula: subtotal = equipment + crew, then tax.
 */
export function computePackagePricing(
  equipmentDailyCost: number,
  crewCost: number,
  taxRate: number,
): PackagePricingSummary {
  const subtotal = roundMoney(equipmentDailyCost + crewCost);
  const tax = computeTaxBreakdown(subtotal, taxRate);
  return {
    equipmentCost: roundMoney(equipmentDailyCost),
    crewCost: roundMoney(crewCost),
    subtotal,
    tax: { rate: tax.taxRate, amount: tax.taxAmount, totalWithTax: tax.total },
  };
}
