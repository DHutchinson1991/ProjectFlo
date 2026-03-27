/**
 * @projectflo/shared — Formatting utilities
 *
 * Canonical currency & number formatting used by both backend and frontend.
 * Pure functions only — no framework, DB, or runtime dependencies.
 */

/**
 * Single source-of-truth fallback when brand currency is unavailable
 * (e.g. during loading before BrandProvider resolves).
 */
export const DEFAULT_CURRENCY = 'GBP';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', GBP: '£', EUR: '€', AUD: 'A$', CAD: 'C$', NZD: 'NZ$',
  JPY: '¥', CHF: 'CHF', ZAR: 'R', INR: '₹', SGD: 'S$',
};

/**
 * Returns the currency symbol for a given ISO 4217 currency code.
 * Falls back to the raw code if no symbol is mapped.
 */
export function getCurrencySymbol(currency: string | null | undefined): string {
  if (!currency) return CURRENCY_SYMBOLS[DEFAULT_CURRENCY] ?? DEFAULT_CURRENCY;
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

/**
 * Formats a numeric value as a currency string using Intl.NumberFormat.
 * Returns '' for null/undefined amounts (safe for template variable injection).
 * Falls back to manual symbol + toFixed if the currency code is unrecognised.
 *
 * @param fractionDigits — number of decimal places (default 2). Use 0 for compact labels.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY,
  fractionDigits = 2,
): string {
  if (amount == null) return '';
  const code = (currency ?? DEFAULT_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(code);
    return `${symbol}${amount.toFixed(fractionDigits)}`;
  }
}
