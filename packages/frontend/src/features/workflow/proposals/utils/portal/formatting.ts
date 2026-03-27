/**
 * Portal & Proposal shared formatting utilities.
 */

import { formatCurrency as _sharedFmtCurrency } from '@projectflo/shared';
import { DEFAULT_CURRENCY } from '@projectflo/shared';

/** Format a date string for display (long form by default). */
export function formatDateLong(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/** Format a date string for display (short form, with optional overrides). */
export function formatDate(d: string | null, opts?: Intl.DateTimeFormatOptions): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

/** Days until a given date (positive = future, negative = past). */
export function getDaysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Format a currency amount. Returns "—" for null/NaN values. Delegates to shared. */
export function formatCurrency(amount: string | number | null | undefined, currency = DEFAULT_CURRENCY): string {
    if (amount === null || amount === undefined) return "—";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "—";
    return _sharedFmtCurrency(num, currency) || "—";
}

/** Format an answer value from a questionnaire submission for display. */
export function formatAnswerValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
}

/** XSS-safe HTML sanitizer (SSR-compatible). */
export function sanitizeHtml(dirty: string): string {
    if (typeof window === "undefined") return dirty;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("dompurify");
    return DOMPurify.sanitize(dirty);
}
