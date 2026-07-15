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
        it('maps bride/groom contact and partner roles to subject slots', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', real_name: null, order_index: 0 },
                { id: 2, name: 'Groom', real_name: null, order_index: 1 },
            ]);

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'bride',
                    partner_role: 'groom',
                    partner_first_name: 'Jordan',
                    partner_last_name: 'Lee',
                },
                'Alex Smith',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Alex Smith' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Jordan Lee' },
            });
        });

        it('fills bride/groom names on the other-role path', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', real_name: null, order_index: 0 },
                { id: 2, name: 'Groom', real_name: null, order_index: 1 },
            ]);

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'other',
                    couple_type: 'bride_groom',
                    bride_first_name: 'Taylor',
                    bride_last_name: 'Brown',
                    groom_first_name: 'Morgan',
                    groom_last_name: 'Green',
                },
                'Mother Planner',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Taylor Brown' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Morgan Green' },
            });
        });

        it('does not partial-match extended subject names like Father of Bride', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', real_name: null, order_index: 0 },
                { id: 2, name: 'Father of Bride', real_name: null, order_index: 1 },
            ]);

            await service.prefillSubjectNames(
                10,
                {
                    contact_role: 'bride',
                    partner_role: 'groom',
                    partner_first_name: 'Jordan',
                    partner_last_name: 'Lee',
                },
                'Alex Smith',
            );

            expect(prisma.projectDaySubject.update).toHaveBeenCalledTimes(1);
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Alex Smith' },
            });
            expect(prisma.projectDaySubject.update).not.toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 2 } }),
            );
        });
    });

    describe('prefillLocationSlots', () => {
        it('assigns ceremony location to matching activity slot', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([
                {
                    id: 50,
                    name: null,
                    activity_assignments: [
                        { project_activity: { name: 'Ceremony' } },
                    ],
                },
            ]);
            prisma.locationsLibrary.findFirst.mockResolvedValue({ id: 99 });
            prisma.projectLocationSlot.update.mockResolvedValue({});

            await service.prefillLocationSlots(
                10,
                {
                    ceremony_location: 'St. Marys Church',
                    ceremony_location_address: '1 Church Lane',
                    venue_lat: 52.5,
                    venue_lng: -2.1,
                },
                1,
            );

            expect(prisma.projectLocationSlot.update).toHaveBeenCalledWith({
                where: { id: 50 },
                data: {
                    location_id: 99,
                    name: 'St. Marys Church',
                    address: '1 Church Lane',
                },
            });
            expect(geocoding.geocodeAddress).not.toHaveBeenCalled();
        });
    });
});
