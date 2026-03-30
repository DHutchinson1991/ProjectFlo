"use client";

import { useBrand } from "../BrandProvider";

/**
 * Returns the IANA timezone string configured for the current brand
 * (e.g. "America/New_York"). Falls back to "UTC" when no brand is loaded.
 *
 * Use this wherever task/event date comparisons are performed so that
 * "today", "overdue", and date groupings are computed in the studio's
 * local timezone rather than UTC or the user's browser timezone.
 */
export function useBrandTimezone(): string {
    const { currentBrand } = useBrand();
    return currentBrand?.timezone ?? "UTC";
}
