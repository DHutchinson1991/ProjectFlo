import { format as fnsFormat, parseISO } from "date-fns";
import { AnyRecord, EventTypeConfig, NominatimResult, ScreenId } from "../types";
import { getCurrencySymbol } from '@/shared/utils/formatUtils';
import { searchVenues } from "@/features/workflow/locations/api/geocoding.api";

/** @deprecated Use searchVenues from api/geocoding directly */
export const searchNominatim = searchVenues;

export function formatShortAddress(r: NominatimResult): string {
    const a = r.address;
    if (!a) return r.display_name;
    const parts: string[] = [];
    if (a.road) parts.push([a.house_number, a.road].filter(Boolean).join(" "));
    const city = a.city || a.town || a.village;
    if (city) parts.push(city);
    if (a.state || a.county) parts.push(a.state || a.county || "");
    if (a.postcode) parts.push(a.postcode);
    return parts.filter(Boolean).join(", ") || r.display_name;
}

/** Format a YYYY-MM-DD string to "Friday, 27 March 2026" */
export function formatNiceDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    try {
        return fnsFormat(parseISO(dateStr), "EEEE, d MMMM yyyy");
    } catch {
        return dateStr;
    }
}

export { getCurrencySymbol };

/* ── Screen list builder ────────────────────────────────────── */
export function computeScreens(r: AnyRecord, cfg: EventTypeConfig): ScreenId[] {
    const list: ScreenId[] = ["welcome", "event_type"];
    if (!r.event_type) return list;
    const et = (r.event_type || "").toLowerCase();

    list.push("date");
    if (cfg.showPartner) list.push("partner");
    if (et === "birthday") list.push("birthday_contact");
    list.push("venue");
    if (cfg.showGuests) list.push("guests");
    list.push("fork");

    if (r.package_path === "pick") {
        list.push("budget", "packages");
    } else if (r.package_path === "build") {
        list.push("builder");
    }

    if (!r.package_path) return list;

    list.push("payment_terms", "special", "source", "call_offer");
    if (r.discovery_call_interest === "yes") list.push("call_details");
    list.push("contact", "summary");
    return list;
}
