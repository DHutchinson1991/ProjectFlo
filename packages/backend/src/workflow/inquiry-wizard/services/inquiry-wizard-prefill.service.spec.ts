import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { GeocodingService } from '../../locations/geocoding.service';

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

const buildGeocoding = () => ({
    geocodeAddress: jest.fn(),
});

describe('InquiryWizardPrefillService', () => {
    let service: InquiryWizardPrefillService;
    let prisma: ReturnType<typeof buildPrisma>;
    let geocoding: ReturnType<typeof buildGeocoding>;

    beforeEach(async () => {
        prisma = buildPrisma();
        geocoding = buildGeocoding();
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
        it('maps bride/groom roles using exact subject name matches only', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', order_index: 0 },
                { id: 2, name: 'Groom', order_index: 1 },
                { id: 3, name: 'Father of Bride', order_index: 2 },
            ]);

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'bride',
                    partner_role: 'groom',
                    partner_first_name: 'Jamie',
                    partner_last_name: 'Lee',
                },
                'Alex Smith',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledTimes(2);
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Alex Smith' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Jamie Lee' },
            });
        });

        it('fills bride and groom names from explicit fields on the other-role path', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', order_index: 0 },
                { id: 2, name: 'Groom', order_index: 1 },
            ]);

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'other',
                    couple_type: 'bride_groom',
                    bride_first_name: 'Sam',
                    bride_last_name: 'Taylor',
                    groom_first_name: 'Chris',
                    groom_last_name: 'Morgan',
                },
                'Planner Name',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Sam Taylor' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Chris Morgan' },
            });
        });

        it('maps second bride for bride_bride couple type', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', order_index: 0 },
                { id: 2, name: 'Bride 2', order_index: 1 },
            ]);

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'other',
                    couple_type: 'bride_bride',
                    bride_first_name: 'Ava',
                    bride_last_name: 'Reed',
                    bride2_first_name: 'Mia',
                    bride2_last_name: 'Reed',
                },
                '',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Ava Reed' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Mia Reed' },
            });
        });

        it('skips updates when no subjects need names', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([]);

            await service.prefillSubjectNames(10, { contact_role: 'bride' }, 'Alex Smith');

            expect(prisma.projectDaySubject.update).not.toHaveBeenCalled();
        });
    });

    describe('prefillLocationSlots', () => {
        it('prefers ceremony_location for ceremony activity slots', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([
                {
                    id: 50,
                    activity_assignments: [{ project_activity: { name: 'Ceremony' } }],
                },
            ]);
            prisma.locationsLibrary.findFirst.mockResolvedValue({ id: 99 });
            prisma.projectLocationSlot.update.mockResolvedValue({});

            await service.prefillLocationSlots(
                10,
                {
                    ceremony_location: 'St Marys Church',
                    ceremony_location_address: '1 Church Lane',
                    venue_lat: 52.1,
                    venue_lng: -2.2,
                },
                1,
            );

            expect(prisma.locationsLibrary.findFirst).toHaveBeenCalled();
            expect(prisma.projectLocationSlot.update).toHaveBeenCalledWith({
                where: { id: 50 },
                data: {
                    location_id: 99,
                    name: 'St Marys Church',
                    address: '1 Church Lane',
                },
            });
            expect(geocoding.geocodeAddress).not.toHaveBeenCalled();
        });
    });
});
