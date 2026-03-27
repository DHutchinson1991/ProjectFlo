import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GeocodingService } from '../locations/geocoding.service';

/**
 * ProjectPackagePrefillService
 *
 * After cloning a package to an inquiry, pre-populates location slot names
 * and subject real_names from the inquiry's submitted needs-assessment responses.
 */
@Injectable()
export class ProjectPackagePrefillService {
    private readonly logger = new Logger(ProjectPackagePrefillService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geocoding: GeocodingService,
    ) {}

    async prefillFromInquiryWizard(
        prisma: Prisma.TransactionClient | PrismaService,
        inquiryId: number,
        brandId: number | null,
    ) {
        const submission = await prisma.inquiry_wizard_submissions.findFirst({
            where: { inquiry_id: inquiryId, status: 'submitted' },
            select: { responses: true },
            orderBy: { submitted_at: 'desc' },
        });
        const responses = (submission?.responses ?? {}) as Record<string, unknown>;

        const inquiry = await prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: { contact: { select: { first_name: true, last_name: true } } },
        });

        await this._prefillLocations(prisma, inquiryId, brandId, responses);
        await this._prefillSubjects(prisma, inquiryId, responses, inquiry?.contact ?? null);
    }

    private async _prefillLocations(
        prisma: Prisma.TransactionClient | PrismaService,
        inquiryId: number,
        brandId: number | null,
        responses: Record<string, unknown>,
    ) {
        const ACTIVITY_LOCATION_MAP: Record<string, string> = {
            ceremony: 'ceremony_location',
            'bridal prep': 'bridal_prep_location',
            'bride prep': 'bridal_prep_location',
            'groom prep': 'groom_prep_location',
            reception: 'reception_location',
        };

        const emptySlots = await prisma.projectLocationSlot.findMany({
            where: { inquiry_id: inquiryId, name: null },
            include: { activity_assignments: { include: { project_activity: { select: { name: true } } } } },
        });

        let filled = 0;
        for (const slot of emptySlots) {
            const assignedNames = slot.activity_assignments.map((a) => a.project_activity?.name?.toLowerCase() ?? '').filter(Boolean);
            let locationName: string | null = null;
            for (const [keyword, key] of Object.entries(ACTIVITY_LOCATION_MAP)) {
                if (assignedNames.some((n) => n.includes(keyword))) {
                    const val = responses[key];
                    if (val && typeof val === 'string' && val.trim()) { locationName = val.trim(); break; }
                }
            }
            if (!locationName) {
                const fallback = responses['ceremony_location'] ?? responses['venue_details'];
                if (fallback && typeof fallback === 'string' && fallback.trim()) locationName = fallback.trim();
            }
            if (!locationName) continue;

            if (brandId !== null) {
                let lib = await prisma.locationsLibrary.findFirst({ where: { name: { equals: locationName, mode: 'insensitive' }, brand_id: brandId, is_active: true }, select: { id: true } });
                if (!lib) {
                    const coords = await this.geocoding.geocodeAddress(locationName);
                    lib = await prisma.locationsLibrary.create({ data: { name: locationName, brand_id: brandId, ...(coords ? { lat: coords.lat, lng: coords.lng, precision: 'EXACT' } : {}) }, select: { id: true } });
                }
                await prisma.projectLocationSlot.update({ where: { id: slot.id }, data: { location_id: lib.id, name: locationName } });
            } else {
                await prisma.projectLocationSlot.update({ where: { id: slot.id }, data: { name: locationName } });
            }
            filled++;
        }
        if (filled) this.logger.log(`PostClone prefill: ${filled} location(s) for inquiry ${inquiryId}`);
    }

    private async _prefillSubjects(
        prisma: Prisma.TransactionClient | PrismaService,
        inquiryId: number,
        responses: Record<string, unknown>,
        contact: { first_name: string | null; last_name: string | null } | null,
    ) {
        const contactFirstName = ((responses['contact_first_name'] as string | undefined)?.trim()) || contact?.first_name || '';
        const contactLastName = ((responses['contact_last_name'] as string | undefined)?.trim()) || contact?.last_name || '';
        const contactFullName = [contactFirstName, contactLastName].filter(Boolean).join(' ');
        const contactRole = ((responses['contact_role'] as string | undefined) ?? '').toLowerCase().trim();
        const partnerName = ((responses['partner_name'] as string | undefined) ?? '').trim();

        if (!contactRole || contactRole === 'prefer not to say' || !contactFullName) return;

        const partnerRole = contactRole === 'bride' ? 'groom' : contactRole === 'groom' ? 'bride' : null;
        const emptySubjects = await prisma.projectDaySubject.findMany({ where: { inquiry_id: inquiryId, real_name: null }, orderBy: { order_index: 'asc' } });

        let filled = 0;
        for (const subject of emptySubjects) {
            const lower = subject.name.toLowerCase();
            let realName: string | null = null;
            if (lower.includes(contactRole)) realName = contactFullName;
            else if (partnerRole && lower.includes(partnerRole) && partnerName) realName = partnerName;
            if (realName) { await prisma.projectDaySubject.update({ where: { id: subject.id }, data: { real_name: realName } }); filled++; }
        }
        if (filled) this.logger.log(`PostClone prefill: ${filled} subject(s) for inquiry ${inquiryId}`);
    }
}
