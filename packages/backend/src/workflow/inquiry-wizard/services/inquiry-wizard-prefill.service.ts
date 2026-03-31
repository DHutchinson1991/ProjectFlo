import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { GeocodingService } from '../../locations/geocoding.service';

@Injectable()
export class InquiryWizardPrefillService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly geocoding: GeocodingService,
    ) {}

    async prefillLocationSlots(
        inquiryId: number,
        responses: Record<string, unknown>,
        brandId: number,
    ): Promise<void> {
        const ACTIVITY_TO_RESPONSE_KEY: Record<string, string> = {
            ceremony: 'ceremony_location',
            'bridal prep': 'bridal_prep_location',
            'bride prep': 'bridal_prep_location',
            'groom prep': 'groom_prep_location',
            reception: 'reception_location',
        };

        const slots = await this.prisma.projectLocationSlot.findMany({
            where: { inquiry_id: inquiryId, name: null },
            include: {
                activity_assignments: {
                    include: { project_activity: { select: { name: true } } },
                },
            },
        });

        if (slots.length === 0) return;

        for (const slot of slots) {
            const assignedNames = slot.activity_assignments
                .map((a) => a.project_activity?.name?.toLowerCase() ?? '')
                .filter(Boolean);
            let locationName: string | null = null;
            let locationAddress: string | null = null;

            for (const [keyword, responseKey] of Object.entries(ACTIVITY_TO_RESPONSE_KEY)) {
                if (assignedNames.some((name) => name.includes(keyword))) {
                    const val = responses[responseKey];
                    if (val && typeof val === 'string' && val.trim()) {
                        locationName = val.trim();
                        const addrVal = responses[`${responseKey}_address`];
                        if (addrVal && typeof addrVal === 'string' && addrVal.trim()) {
                            locationAddress = addrVal.trim();
                        }
                        break;
                    }
                }
            }

            if (!locationName) {
                // Prefer venue_name (actual place name, e.g. "Buckatree Hall Hotel")
                // over venue_details (short address like "Ercall Lane, Telford, TF6 5AL")
                const venueName = responses['venue_name'];
                const venueDetails = responses['venue_details'];
                const fallback = responses['ceremony_location'] ?? venueName ?? venueDetails;
                if (fallback && typeof fallback === 'string' && fallback.trim()) {
                    locationName = fallback.trim();
                    // If we used venue_name as the name, use venue_details as the address
                    if (venueName && typeof venueName === 'string' && venueName.trim() && !locationAddress) {
                        const detailsAddr = venueDetails ?? responses['venue_address'];
                        if (detailsAddr && typeof detailsAddr === 'string' && detailsAddr.trim()) {
                            locationAddress = (detailsAddr as string).trim();
                        }
                    }
                    const fallbackAddr = responses['ceremony_location_address'] ?? responses['venue_address'];
                    if (!locationAddress && fallbackAddr && typeof fallbackAddr === 'string' && fallbackAddr.trim()) {
                        locationAddress = fallbackAddr.trim();
                    }
                }
            }

            if (locationName) {
                // Use lat/lng from wizard responses if available (avoids re-geocoding)
                const lat = responses['venue_lat'] != null ? Number(responses['venue_lat']) : null;
                const lng = responses['venue_lng'] != null ? Number(responses['venue_lng']) : null;
                const coords = (lat && lng && !isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;

                const libEntry = await this.resolveOrCreateLibraryEntry(locationName, locationAddress, brandId, coords);
                await this.prisma.projectLocationSlot.update({
                    where: { id: slot.id },
                    data: {
                        location_id: libEntry.id,
                        name: locationName,
                        ...(locationAddress ? { address: locationAddress } : {}),
                    },
                });
            }
        }
    }

    async prefillSubjectNames(
        inquiryId: number,
        responses: Record<string, unknown>,
        contactFullName: string,
    ): Promise<void> {
        const contactRole = ((responses['contact_role'] as string | undefined) ?? '').toLowerCase().trim();
        const coupleType = ((responses['couple_type'] as string | undefined) ?? '').toLowerCase().trim();

        // Compose partner name from split fields, with legacy fallback
        const partnerFirst = ((responses['partner_first_name'] as string | undefined) ?? '').trim();
        const partnerLast = ((responses['partner_last_name'] as string | undefined) ?? '').trim();
        const partnerName = [partnerFirst, partnerLast].filter(Boolean).join(' ')
            || ((responses['partner_name'] as string | undefined) ?? '').trim();

        const subjects = await this.prisma.projectDaySubject.findMany({
            where: { inquiry_id: inquiryId, real_name: null },
            orderBy: { order_index: 'asc' },
        });
        if (subjects.length === 0) return;

        // Build a name map: subjectNameLower → real_name
        const nameMap = new Map<string, string>();

        if (contactRole === 'other') {
            // "Other" path: fill from explicit bride/groom name fields
            this._mapOtherPathNames(responses, coupleType, nameMap);
        } else if (contactRole === 'bride' || contactRole === 'groom') {
            // Bride/Groom path: contact fills their role, partner fills the other
            if (contactFullName) {
                nameMap.set(contactRole, contactFullName);
            }
            if (partnerName) {
                const partnerRole = ((responses['partner_role'] as string | undefined) ?? '').toLowerCase().trim();
                if (partnerRole) {
                    nameMap.set(partnerRole, partnerName);
                }
            }
        }

        if (nameMap.size === 0) return;

        for (const subject of subjects) {
            const subjectNameLower = subject.name.toLowerCase().trim();

            // Only exact match — "Bride" maps to "bride", "Groom 2" maps to "groom 2".
            // We intentionally skip partial matches so "Father of Bride"/"Bridesmaids" etc.
            // don't incorrectly get the Bride's real name.
            const realName = nameMap.get(subjectNameLower) ?? null;

            if (realName) {
                await this.prisma.projectDaySubject.update({
                    where: { id: subject.id },
                    data: { real_name: realName },
                });
            }
        }
    }

    /**
     * Build name map for the "Other" role path (e.g. Mother of the Bride filling in).
     * Uses explicit bride/groom name fields from the BrideGroomNamesStep.
     */
    private _mapOtherPathNames(
        responses: Record<string, unknown>,
        coupleType: string,
        nameMap: Map<string, string>,
    ): void {
        const compose = (firstKey: string, lastKey: string): string =>
            [responses[firstKey], responses[lastKey]]
                .map((v) => ((v as string | undefined) ?? '').trim())
                .filter(Boolean)
                .join(' ');

        if (coupleType === 'bride_groom' || !coupleType) {
            const brideName = compose('bride_first_name', 'bride_last_name');
            const groomName = compose('groom_first_name', 'groom_last_name');
            if (brideName) nameMap.set('bride', brideName);
            if (groomName) nameMap.set('groom', groomName);
        } else if (coupleType === 'bride_bride') {
            const bride1 = compose('bride_first_name', 'bride_last_name');
            const bride2 = compose('bride2_first_name', 'bride2_last_name');
            if (bride1) nameMap.set('bride', bride1);
            if (bride2) nameMap.set('bride 2', bride2);
        } else if (coupleType === 'groom_groom') {
            const groom1 = compose('groom_first_name', 'groom_last_name');
            const groom2 = compose('groom2_first_name', 'groom2_last_name');
            if (groom1) nameMap.set('groom', groom1);
            if (groom2) nameMap.set('groom 2', groom2);
        }
    }

    private async resolveOrCreateLibraryEntry(
        locationName: string,
        locationAddress: string | null,
        brandId: number,
        knownCoords?: { lat: number; lng: number } | null,
    ): Promise<{ id: number }> {
        const existing = await this.prisma.locationsLibrary.findFirst({
            where: {
                name: { equals: locationName, mode: 'insensitive' },
                brand_id: brandId,
                is_active: true,
            },
            select: { id: true },
        });
        if (existing) return existing;

        // Prefer coordinates already captured by the wizard (from Nominatim on the frontend)
        let coords = knownCoords ?? null;
        if (!coords) {
            const geocodeQuery = locationAddress ? `${locationName}, ${locationAddress}` : locationName;
            coords = await this.geocoding.geocodeAddress(geocodeQuery);
        }

        return this.prisma.locationsLibrary.create({
            data: {
                name: locationName,
                brand_id: brandId,
                ...(locationAddress ? { address_line1: locationAddress } : {}),
                ...(coords ? { lat: coords.lat, lng: coords.lng, precision: 'EXACT' } : {}),
            },
            select: { id: true },
        });
    }
}
