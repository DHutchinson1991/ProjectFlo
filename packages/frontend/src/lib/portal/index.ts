/**
 * Portal shared utilities — barrel export.
 *
 * Usage:
 *   import { getThemeColors, useReveal, formatCurrency } from "@/lib/portal";
 */

export { getThemeColors, getPortalDashboardColors } from "./themes";
export type { PortalThemeColors, PortalDashboardColors } from "./themes";

export {
    fadeInUp, fadeIn, scaleIn, shimmer, float,
    pulseGlow, gradientShift, subtleFloat,
    useReveal, revealSx,
} from "./animations";

export {
    formatDate, formatDateLong, getDaysUntil,
    formatCurrency, formatAnswerValue, sanitizeHtml,
} from "./formatting";
