/**
 * Re-exports from @projectflo/shared (the single source of truth).
 * All pricing math is defined once in packages/shared/src/pricing.ts.
 *
 * Frontend-only aliases (e.g. computeItemsSubtotal) are kept here
 * for backward compatibility but delegate to the shared package.
 */
export {
  roundMoney,
  computeLineTotal,
  computeItemsTotal,
  computeTaxBreakdown,
  computeEquipmentBreakdown,
  computeTaskCostBreakdown,
  computeCrewCost,
  computePackagePricing,
} from '@projectflo/shared';
export type {
  PricingEquipmentRel,
  PricingCrewSlotForEquipment,
  EquipmentBreakdown,
  PricingTaskRow,
  TaskCostBreakdown,
  PricingCrewSlotForDayRate,
  PackagePricingSummary,
} from '@projectflo/shared';

/** @deprecated Use computeItemsTotal instead. Kept for backward compat. */
export { computeItemsTotal as computeItemsSubtotal } from '@projectflo/shared';
