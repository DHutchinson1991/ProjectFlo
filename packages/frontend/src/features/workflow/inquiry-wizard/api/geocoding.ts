import type { NominatimResult } from '../types';

/**
 * Venue/address forward search via Photon (komoot).
 * Location-biased towards UK (centre of England).
 */
export async function searchVenues(query: string): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];
    const params = new URLSearchParams({ q: query, limit: '8', lang: 'en', lat: '52.5', lon: '-1.5' });
    const res = await fetch(
        `https://photon.komoot.io/api/?${params}`,
        { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return [];
    const geojson = await res.json() as { features?: unknown[] };
    return (geojson.features || []).map((f: unknown, i: number) => {
        const feature = f as { properties?: Record<string, unknown>; geometry?: { coordinates?: [number, number] } };
        const p = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];
        const nameParts = [
            p['name'],
            p['housenumber'] ? `${p['housenumber']} ${p['street'] || ''}`.trim() : p['street'],
            p['city'] || p['town'] || p['village'],
            p['county'],
            p['state'],
            p['postcode'],
            p['country'],
        ].filter(Boolean) as string[];
        const display = nameParts.filter((v, idx) => nameParts.indexOf(v) === idx).join(', ');
        return {
            place_id: (p['osm_id'] as number) ?? i,
            display_name: display,
            name: p['name'] as string,
            lat: String(lat),
            lon: String(lon),
            address: {
                road: p['street'] as string,
                house_number: p['housenumber'] as string,
                city: (p['city'] || p['town'] || p['village']) as string,
                state: p['state'] as string,
                postcode: p['postcode'] as string,
                country: p['country'] as string,
                county: p['county'] as string,
            },
        } as NominatimResult;
    });
}

/**
 * Reverse geocode a lat/lng coordinate to a human-readable region name.
 * Uses Nominatim (OpenStreetMap).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { Accept: 'application/json', 'User-Agent': 'ProjectFlo/1.0' } },
        );
        if (!res.ok) return null;
        const data = await res.json() as { address?: Record<string, string>; display_name?: string };
        const a = data.address || {};
        const county = a['county'] || a['state_district'] || a['city'] || a['town'] || a['village'] || '';
        const state = a['state'] || '';
        const country = a['country'] || '';
        const parts = [county, state !== county ? state : '', country].filter(Boolean);
        const seen = new Set<string>();
        const deduped = parts.filter(p => { if (seen.has(p)) return false; seen.add(p); return true; });
        return deduped.slice(0, 3).join(', ') || data.display_name || null;
    } catch {
        return null;
    }
}
