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
                const fallback = responses['ceremony_location'] ?? responses['venue_details'];
                if (fallback && typeof fallback === 'string' && fallback.trim()) {
                    locationName = fallback.trim();
                    const fallbackAddr = responses['ceremony_location_address'] ?? responses['venue_address'];
                    if (fallbackAddr && typeof fallbackAddr === 'string' && fallbackAddr.trim()) {
                        locationAddress = fallbackAddr.trim();
                    }
                }
            }

            if (locationName) {
                const libEntry = await this.resolveOrCreateLibraryEntry(locationName, locationAddress, brandId);
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
        const partnerName = ((responses['partner_name'] as string | undefined) ?? '').trim();

        if (!contactRole || contactRole === 'prefer not to say' || !contactFullName) return;

        let partnerRole: string | null = null;
        if (contactRole === 'bride') partnerRole = 'groom';
        else if (contactRole === 'groom') partnerRole = 'bride';

        const subjects = await this.prisma.projectDaySubject.findMany({
            where: { inquiry_id: inquiryId, real_name: null },
            orderBy: { order_index: 'asc' },
        });
        if (subjects.length === 0) return;

        for (const subject of subjects) {
            const subjectNameLower = subject.name.toLowerCase();
            let realName: string | null = null;

            if (subjectNameLower.includes(contactRole)) {
                realName = contactFullName;
            } else if (partnerRole && subjectNameLower.includes(partnerRole) && partnerName) {
                realName = partnerName;
            }

            if (realName) {
                await this.prisma.projectDaySubject.update({
                    where: { id: subject.id },
                    data: { real_name: realName },
                });
            }
        }
    }

    private async resolveOrCreateLibraryEntry(
        locationName: string,
        locationAddress: string | null,
        brandId: number,
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

        const geocodeQuery = locationAddress ? `${locationName}, ${locationAddress}` : locationName;
        const coords = await this.geocoding.geocodeAddress(geocodeQuery);

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
