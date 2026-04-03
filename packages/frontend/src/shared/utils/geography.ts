/**
 * Geography utilities — distance calculations and formatting.
 */

/** Haversine distance (km) between two lat/lng pairs. */
export function haversineKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
): number {
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format km as imperial distance string ("0.5 mi" or "2641 ft"). */
export function formatDistance(km: number): string {
    const miles = km * 0.621371;
    if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
    return `${miles.toFixed(1)} mi`;
}
