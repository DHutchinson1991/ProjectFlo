/**
 * @projectflo/shared — Pricing utilities
 *
 * THE single source of truth for all financial arithmetic.
 * Both packages/backend and packages/frontend import from here.
 * Pure functions only — no framework, DB, or runtime dependencies.
 */

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
