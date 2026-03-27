/**
 * Estimate cost types.
 *
 * Rate resolution, crew constants, and CrewAccum are canonical in @projectflo/shared.
 * This file re-exports them for backward compatibility and adds estimate-specific types.
 */
export {
  resolveHourlyRate,
  resolveDayRate,
  usesDayRate,
  NON_DELIVERY_PHASES as TASK_EXCLUDED_PHASES,
  PLANNING_CATEGORIES,
  POST_PRODUCTION_CATEGORIES,
  roundMoney,
} from '@projectflo/shared';
export type { CrewAccum } from '@projectflo/shared';

export type AutoEstimateItem = {
  category?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};
