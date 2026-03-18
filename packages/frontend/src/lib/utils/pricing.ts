/**
 * Centralized pricing / tax computation helpers.
 *
 * Every surface that needs to derive tax or post-tax totals should use these
 * rather than inlining the arithmetic, so the rounding strategy stays consistent.
 */

export interface TaxBreakdown {
  /** Pre-tax subtotal (same value passed in) */
  subtotal: number;
  /** Tax rate as a percentage, e.g. 20 means 20 % */
  taxRate: number;
  /** Computed tax amount, rounded to 2 decimals */
  taxAmount: number;
  /** subtotal + taxAmount, rounded to 2 decimals */
  total: number;
}

/**
 * Compute tax amount and post-tax total from a pre-tax subtotal and a
 * percentage tax rate.
 *
 * Rounding: standard 2-decimal-place rounding (half-up via `Math.round`).
 */
export function computeTaxBreakdown(
  subtotal: number,
  taxRate: number,
): TaxBreakdown {
  const rate = taxRate || 0;
  const taxAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxRate: rate, taxAmount, total };
}
