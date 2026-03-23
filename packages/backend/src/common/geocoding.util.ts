/**
 * Lightweight Nominatim (OSM) geocoder.
 * Used to resolve location names to lat/lng when auto-creating LocationsLibrary entries.
 * Nominatim usage policy: one request at a time, proper User-Agent, no mass/automated bulk geocoding.
 */

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
}

export interface GeocodedCoords {
    lat: number;
    lng: number;
}

/**
 * Geocode a free-text address/name string via Nominatim.
 * Returns { lat, lng } on success, or null if no result / request fails.
 *
 * @param query - Address or place name (e.g. "Combermere Abbey, Whitchurch, UK")
 */
export async function geocodeAddress(query: string): Promise<GeocodedCoords | null> {
    if (!query?.trim()) return null;

    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'json');
        url.searchParams.set('q', query.trim());
        url.searchParams.set('limit', '1');

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'ProjectFlo/1.0 (locationslibrary-autofill)',
                'Accept-Language': 'en',
            },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) return null;

        const results = (await response.json()) as NominatimResult[];
        if (!results.length) return null;

        const { lat, lon } = results[0];
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lon);

        if (isNaN(parsedLat) || isNaN(parsedLng)) return null;

        return { lat: parsedLat, lng: parsedLng };
    } catch {
        // Network error, timeout, JSON parse failure — silently skip geocoding
        return null;
    }
}
