/**
 * Portal & Proposal shared theme system.
 *
 * Single source of truth for the four portal colour palettes.
 * Both the portal page and proposal page import from here.
 */

export interface PortalThemeColors {
    bg: string;
    card: string;
    text: string;
    muted: string;
    accent: string;
    border: string;
    accentSoft: string;
    gradient1: string;
    gradient2: string;
}

/**
 * Extended colours used by the portal dashboard (adds `green`).
 * Compatible with `PortalThemeColors` — spread the base + add extras.
 */
export interface PortalDashboardColors extends PortalThemeColors {
    green: string;
}

/** Return a colour palette for the given theme name. */
export function getThemeColors(theme?: string): PortalThemeColors {
    switch (theme) {
        case "minimal-light":
            return {
                bg: "#fafafa", card: "#ffffff", text: "#1a1a1a", muted: "#71717a",
                accent: "#18181b", border: "#e4e4e7", accentSoft: "#f4f4f5",
                gradient1: "#e4e4e7", gradient2: "#d4d4d8",
            };
        case "classic-elegant":
            return {
                bg: "#faf8f4", card: "#ffffff", text: "#292524", muted: "#78716c",
                accent: "#92400e", border: "#e7e5e4", accentSoft: "#fef3c7",
                gradient1: "#fde68a", gradient2: "#f59e0b",
            };
        case "modern-clean":
            return {
                bg: "#f8fafc", card: "#ffffff", text: "#0f172a", muted: "#64748b",
                accent: "#3b82f6", border: "#e2e8f0", accentSoft: "#eff6ff",
                gradient1: "#93c5fd", gradient2: "#3b82f6",
            };
        case "cinematic-dark":
        default:
            return {
                bg: "#09090b", card: "#18181b", text: "#fafafa", muted: "#a1a1aa",
                accent: "#7c4dff", border: "#27272a", accentSoft: "#1e1b4b",
                gradient1: "#7c4dff", gradient2: "#a855f7",
            };
    }
}

/** Convenience: the portal dashboard always uses cinematic-dark + green. */
export function getPortalDashboardColors(): PortalDashboardColors {
    return { ...getThemeColors("cinematic-dark"), green: "#22c55e" };
}
