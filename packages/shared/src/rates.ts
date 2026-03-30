/**
 * @projectflo/shared — Rate resolution & crew costing constants
 *
 * THE single source of truth for resolving crew hourly / day rates
 * from the payment_bracket -> crew_job_roles -> crew hierarchy.
 *
 * Pure functions only — no framework, DB, or runtime dependencies.
 */

// ── Shared constants ────────────────────────────────────────────────

/** Phases excluded from delivery-cost calculations (sales pipeline only). */
export const NON_DELIVERY_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);

/** Job-role categories bucketed as "Planning" crew. */
export const PLANNING_CATEGORIES = new Set(['creative', 'production', 'technical']);

/** Job-role categories bucketed as "Post-Production" crew. */
export const POST_PRODUCTION_CATEGORIES = new Set(['post-production']);

// ── Minimal structural type for rate resolution ─────────────────────

export interface RateResolvable {
  job_role_id?: number | null;
  // Keep `crew` for backward compatibility with current API payloads.
  crew?: {
    job_role_assignments?: ReadonlyArray<{
      job_role_id?: number | null;
      is_primary?: boolean;
      payment_bracket?: {
        hourly_rate?: unknown;
        day_rate?: unknown;
      } | null;
    }>;
  } | null;
}

/** Accumulator shape used when bucketing crew by person+role. */
export interface CrewAccum {
  name: string;
  role: string;
  hours: number;
  days: number;
  hourlyRate: number;
  dayRate: number;
  useDayRate: boolean;
}

// ── Rate resolution (direct lookup — no fallback chain) ─────────────

/**
 * Resolve the **hourly rate** for a crew operator from their
 * payment bracket matching `job_role_id`.
 *
 * Returns `0` when the data is missing — callers should treat that as
 * "rate not configured" rather than silently falling back to unrelated
 * brackets or crew defaults.
 */
export function resolveHourlyRate(op: RateResolvable): number {
  const bracket = matchedBracket(op);
  return bracket?.hourly_rate ? Number(bracket.hourly_rate) : 0;
}

/**
 * Resolve the **day rate** for a crew operator from their
 * payment bracket matching `job_role_id`.
 */
export function resolveDayRate(op: RateResolvable): number {
  const bracket = matchedBracket(op);
  return bracket?.day_rate ? Number(bracket.day_rate) : 0;
}

/**
 * Whether the operator's matching bracket is a **day-rate** bracket
 * (has `day_rate > 0` and `hourly_rate === 0`).
 */
export function usesDayRate(op: RateResolvable): boolean {
  const bracket = matchedBracket(op);
  if (!bracket) return false;
  return (
    Number(bracket.day_rate || 0) > 0 &&
    Number(bracket.hourly_rate || 0) === 0
  );
}

// ── Internal ────────────────────────────────────────────────────────

/** Find the payment bracket for the operator's assigned job role. */
function matchedBracket(op: RateResolvable) {
  if (!op.job_role_id) return null;
  const roles = op.crew?.job_role_assignments;
  if (!roles) return null;
  const match = roles.find((r: { job_role_id?: number | null }) => r.job_role_id === op.job_role_id);
  return match?.payment_bracket ?? null;
}
