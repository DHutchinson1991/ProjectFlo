import { format as fnsFormat, parseISO } from "date-fns";
import { AnyRecord, EventTypeConfig, NominatimResult, ScreenId } from "./types";
import { CURRENCY_SYMBOLS } from "./constants";

/* ── Venue search via Photon (komoot) — far better POI/venue coverage than Nominatim ── */
export async function searchNominatim(query: string): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];
    // Location-biased towards UK (centre of England) so "The Mill Barns" beats unrelated matches
    const params = new URLSearchParams({ q: query, limit: "8", lang: "en", lat: "52.5", lon: "-1.5" });
    const res = await fetch(
        `https://photon.komoot.io/api/?${params}`,
        { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const geojson = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (geojson.features || []).map((f: any, i: number) => {
        const p = f.properties || {};
        const [lon, lat] = f.geometry?.coordinates || [0, 0];
        const nameParts = [
            p.name,
            p.housenumber ? `${p.housenumber} ${p.street || ""}`.trim() : p.street,
            p.city || p.town || p.village,
            p.county,
            p.state,
            p.postcode,
            p.country,
        ].filter(Boolean) as string[];
        // Deduplicate adjacent identical segments
        const display = nameParts.filter((v, idx) => nameParts.indexOf(v) === idx).join(", ");
        return {
            place_id: p.osm_id ?? i,
            display_name: display,
            name: p.name,
            lat: String(lat),
            lon: String(lon),
            address: {
                road: p.street,
                house_number: p.housenumber,
                city: p.city || p.town || p.village,
                state: p.state,
                postcode: p.postcode,
                country: p.country,
                county: p.county,
            },
        } as NominatimResult;
    });
}

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

export function getCurrencySymbol(c: string | null | undefined) {
    return c ? CURRENCY_SYMBOLS[c.toUpperCase()] ?? c : "$";
}

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
