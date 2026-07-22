import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { GeocodingService } from '../../locations/geocoding.service';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';

const buildPrisma = () => ({
    projectLocationSlot: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    projectDaySubject: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    locationsLibrary: {
        findFirst: jest.fn(),
        create: jest.fn(),
    },
});

describe('InquiryWizardPrefillService', () => {
    let service: InquiryWizardPrefillService;
    let prisma: ReturnType<typeof buildPrisma>;
    let geocoding: { geocodeAddress: jest.Mock };

    beforeEach(async () => {
        prisma = buildPrisma();
        geocoding = { geocodeAddress: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardPrefillService,
                { provide: PrismaService, useValue: prisma },
                { provide: GeocodingService, useValue: geocoding },
            ],
        }).compile();

        service = module.get(InquiryWizardPrefillService);
    });

    describe('prefillSubjectNames', () => {
        it('maps bride contact and partner to exact subject role names', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', real_name: null },
                { id: 2, name: 'Groom', real_name: null },
            ]);
            prisma.projectDaySubject.update.mockResolvedValue({});

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'bride',
                    partner_role: 'groom',
                    partner_first_name: 'Jordan',
                    partner_last_name: 'Lee',
                },
                'Alex Morgan',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledTimes(2);
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Alex Morgan' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Jordan Lee' },
            });
        });

        it('fills bride and groom names on the other-role path', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', real_name: null },
                { id: 2, name: 'Groom', real_name: null },
            ]);
            prisma.projectDaySubject.update.mockResolvedValue({});

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'other',
                    couple_type: 'bride_groom',
                    bride_first_name: 'Casey',
                    bride_last_name: 'North',
                    groom_first_name: 'Riley',
                    groom_last_name: 'South',
                },
                'Mother of Bride',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Casey North' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Riley South' },
            });
        });

        it('maps bride-bride couple type to bride and bride 2 subjects', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', real_name: null },
                { id: 2, name: 'Bride 2', real_name: null },
            ]);
            prisma.projectDaySubject.update.mockResolvedValue({});

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'other',
                    couple_type: 'bride_bride',
                    bride_first_name: 'Ava',
                    bride_last_name: 'One',
                    bride2_first_name: 'Mia',
                    bride2_last_name: 'Two',
                },
                'Planner',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Ava One' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Mia Two' },
            });
        });

        it('does not partial-match extended subject labels like Father of Bride', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', real_name: null },
                { id: 2, name: 'Father of Bride', real_name: null },
            ]);
            prisma.projectDaySubject.update.mockResolvedValue({});

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'bride',
                    partner_role: 'groom',
                    partner_first_name: 'Jordan',
                    partner_last_name: 'Lee',
                },
                'Alex Morgan',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledTimes(1);
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Alex Morgan' },
            });
        });

        it('skips updates when no subjects need names', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([]);

            await service.prefillSubjectNames(10, { contact_role: 'bride' }, 'Alex Morgan');

            expect(prisma.projectDaySubject.update).not.toHaveBeenCalled();
        });
    });

    describe('prefillLocationSlots', () => {
        it('assigns ceremony location from activity keyword and reuses wizard coordinates', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([
                {
                    id: 50,
                    activity_assignments: [
                        { project_activity: { name: 'Ceremony' } },
                    ],
                },
            ]);
            prisma.locationsLibrary.findFirst.mockResolvedValue(null);
            prisma.locationsLibrary.create.mockResolvedValue({ id: 99 });
            prisma.projectLocationSlot.update.mockResolvedValue({});

            await service.prefillLocationSlots(
                10,
                {
                    ceremony_location: 'St Marys Church',
                    ceremony_location_address: '1 Church Lane',
                    venue_lat: 52.7,
                    venue_lng: -2.4,
                },
                1,
            );

            expect(prisma.locationsLibrary.create).toHaveBeenCalledWith({
                data: {
                    name: 'St Marys Church',
                    brand_id: 1,
                    address_line1: '1 Church Lane',
                    lat: 52.7,
                    lng: -2.4,
                    precision: 'EXACT',
                },
                select: { id: true },
            });
            expect(geocoding.geocodeAddress).not.toHaveBeenCalled();
            expect(prisma.projectLocationSlot.update).toHaveBeenCalledWith({
                where: { id: 50 },
                data: {
                    location_id: 99,
                    name: 'St Marys Church',
                    address: '1 Church Lane',
                },
            });
        });

        it('falls back to venue_name when no activity-specific location is provided', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([
                {
                    id: 51,
                    activity_assignments: [
                        { project_activity: { name: 'Reception' } },
                    ],
                },
            ]);
            prisma.locationsLibrary.findFirst.mockResolvedValue({ id: 77 });
            prisma.projectLocationSlot.update.mockResolvedValue({});

            await service.prefillLocationSlots(
                10,
                {
                    venue_name: 'Buckatree Hall Hotel',
                    venue_details: 'Ercall Lane, Telford',
                },
                1,
            );

            expect(prisma.locationsLibrary.create).not.toHaveBeenCalled();
            expect(prisma.projectLocationSlot.update).toHaveBeenCalledWith({
                where: { id: 51 },
                data: {
                    location_id: 77,
                    name: 'Buckatree Hall Hotel',
                    address: 'Ercall Lane, Telford',
                },
            });
        });
    });
});
