import { requestExternal } from '@/shared/api/client';

export interface NominatimResult {
    place_id: number;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
        country?: string;
        county?: string;
        amenity?: string;
        building?: string;
        leisure?: string;
        tourism?: string;
        historic?: string;
        shop?: string;
        office?: string;
        [key: string]: string | undefined;
    };
}

export interface GeocodedPoint {
    lat: number;
    lng: number;
}

export async function searchNominatim(query: string): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];

    const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
    });

    return requestExternal<NominatimResult[]>(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'ProjectFlo/1.0',
            },
        },
    ).catch(() => []);
}

export async function geocodeAddress(address: string): Promise<GeocodedPoint | null> {
    const results = await searchNominatim(address);
    const first = results[0];
    if (!first) return null;

    return {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
    };
}

export async function searchVenues(query: string): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];

    const params = new URLSearchParams({
        q: query,
        limit: '8',
        lang: 'en',
        lat: '52.5',
        lon: '-1.5',
    });

    const geojson = await requestExternal<{ features?: unknown[] }>(
        `https://photon.komoot.io/api/?${params}`,
        { headers: { Accept: 'application/json' } },
    ).catch(() => ({ features: [] }));

    return (geojson.features || []).map((featureValue: unknown, index: number) => {
        const feature = featureValue as {
            properties?: Record<string, unknown>;
            geometry?: { coordinates?: [number, number] };
        };
        const properties = feature.properties || {};
        const [lon, lat] = feature.geometry?.coordinates || [0, 0];
        const nameParts = [
            properties.name,
            properties.housenumber ? `${properties.housenumber} ${properties.street || ''}`.trim() : properties.street,
            properties.city || properties.town || properties.village,
            properties.county,
            properties.state,
            properties.postcode,
            properties.country,
        ].filter(Boolean) as string[];

        return {
            place_id: (properties.osm_id as number) ?? index,
            display_name: nameParts.filter((value, valueIndex) => nameParts.indexOf(value) === valueIndex).join(', '),
            name: properties.name as string | undefined,
            lat: String(lat),
            lon: String(lon),
            address: {
                road: properties.street as string | undefined,
                house_number: properties.housenumber as string | undefined,
                city: (properties.city || properties.town || properties.village) as string | undefined,
                state: properties.state as string | undefined,
                postcode: properties.postcode as string | undefined,
                country: properties.country as string | undefined,
                county: properties.county as string | undefined,
            },
        } satisfies NominatimResult;
    });
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const data = await requestExternal<{ address?: Record<string, string>; display_name?: string }>(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'ProjectFlo/1.0',
            },
        },
    ).catch(() => null);

    if (!data) return null;

    const address = data.address || {};
    const county = address.county || address.state_district || address.city || address.town || address.village || '';
    const state = address.state || '';
    const country = address.country || '';
    const parts = [county, state !== county ? state : '', country].filter(Boolean);
    const seen = new Set<string>();
    const deduped = parts.filter((part) => {
        if (seen.has(part)) return false;
        seen.add(part);
        return true;
    });

    return deduped.slice(0, 3).join(', ') || data.display_name || null;
}