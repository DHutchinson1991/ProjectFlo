/**
 * Re-exports from @projectflo/shared (the single source of truth).
 * All rate-resolution logic is defined once in packages/shared/src/rates.ts.
 */
export {
  resolveHourlyRate,
  resolveDayRate,
  usesDayRate,
  NON_DELIVERY_PHASES,
  PLANNING_CATEGORIES,
  POST_PRODUCTION_CATEGORIES,
} from '@projectflo/shared';
export type { RateResolvable, CrewAccum } from '@projectflo/shared';
