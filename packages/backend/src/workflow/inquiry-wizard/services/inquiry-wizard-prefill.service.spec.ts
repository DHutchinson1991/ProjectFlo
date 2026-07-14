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
        geocoding = { geocodeAddress: jest.fn().mockResolvedValue({ lat: 52.7, lng: -2.5 }) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardPrefillService,
                { provide: PrismaService, useValue: prisma },
                { provide: GeocodingService, useValue: geocoding },
            ],
        }).compile();

        service = module.get(InquiryWizardPrefillService);
    });

    describe('prefillLocationSlots', () => {
        it('skips when no unnamed location slots exist', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([]);

            await service.prefillLocationSlots(1, { ceremony_location: 'St Marys' }, 10);

            expect(prisma.projectLocationSlot.update).not.toHaveBeenCalled();
        });

        it('maps ceremony activity to ceremony_location response', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([
                {
                    id: 5,
                    activity_assignments: [{ project_activity: { name: 'Ceremony' } }],
                },
            ]);
            prisma.locationsLibrary.findFirst.mockResolvedValue(null);
            prisma.locationsLibrary.create.mockResolvedValue({ id: 99 });
            prisma.projectLocationSlot.update.mockResolvedValue({});

            await service.prefillLocationSlots(1, {
                ceremony_location: 'Buckatree Hall',
                ceremony_location_address: 'Ercall Lane, Telford',
            }, 10);

            expect(prisma.locationsLibrary.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: 'Buckatree Hall',
                        address_line1: 'Ercall Lane, Telford',
                        brand_id: 10,
                    }),
                }),
            );
            expect(prisma.projectLocationSlot.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: expect.objectContaining({
                    location_id: 99,
                    name: 'Buckatree Hall',
                    address: 'Ercall Lane, Telford',
                }),
            });
        });

        it('reuses existing library entry instead of geocoding', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([
                {
                    id: 6,
                    activity_assignments: [{ project_activity: { name: 'Reception' } }],
                },
            ]);
            prisma.locationsLibrary.findFirst.mockResolvedValue({ id: 42 });

            await service.prefillLocationSlots(1, { reception_location: 'The Venue' }, 10);

            expect(geocoding.geocodeAddress).not.toHaveBeenCalled();
            expect(prisma.locationsLibrary.create).not.toHaveBeenCalled();
            expect(prisma.projectLocationSlot.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ location_id: 42 }),
                }),
            );
        });

        it('uses wizard lat/lng coords without geocoding', async () => {
            prisma.projectLocationSlot.findMany.mockResolvedValue([
                {
                    id: 7,
                    activity_assignments: [],
                },
            ]);
            prisma.locationsLibrary.findFirst.mockResolvedValue(null);
            prisma.locationsLibrary.create.mockResolvedValue({ id: 50 });

            await service.prefillLocationSlots(1, {
                venue_name: 'Hotel',
                venue_lat: 51.5,
                venue_lng: -0.1,
            }, 10);

            expect(geocoding.geocodeAddress).not.toHaveBeenCalled();
            expect(prisma.locationsLibrary.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ lat: 51.5, lng: -0.1, precision: 'EXACT' }),
                }),
            );
        });
    });

    describe('prefillSubjectNames', () => {
        it('skips when no unnamed subjects exist', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([]);

            await service.prefillSubjectNames(1, { contact_role: 'bride' }, 'Jane Doe');

            expect(prisma.projectDaySubject.update).not.toHaveBeenCalled();
        });

        it('fills bride/groom from contact role and partner fields', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', order_index: 0 },
                { id: 2, name: 'Groom', order_index: 1 },
            ]);
            prisma.projectDaySubject.update.mockResolvedValue({});

            await service.prefillSubjectNames(1, {
                contact_role: 'bride',
                partner_role: 'groom',
                partner_first_name: 'John',
                partner_last_name: 'Smith',
            }, 'Jane Doe');

            expect(prisma.projectDaySubject.update).toHaveBeenCalledTimes(2);
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Jane Doe' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'John Smith' },
            });
        });

        it('uses exact match only — does not fill Father of Bride from bride name', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', order_index: 0 },
                { id: 2, name: 'Father of Bride', order_index: 1 },
            ]);
            prisma.projectDaySubject.update.mockResolvedValue({});

            await service.prefillSubjectNames(1, {
                contact_role: 'bride',
            }, 'Jane Doe');

            expect(prisma.projectDaySubject.update).toHaveBeenCalledTimes(1);
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Jane Doe' },
            });
        });

        it('maps bride_bride couple type via other path', async () => {
            prisma.projectDaySubject.findMany.mockResolvedValue([
                { id: 1, name: 'Bride', order_index: 0 },
                { id: 2, name: 'Bride 2', order_index: 1 },
            ]);
            prisma.projectDaySubject.update.mockResolvedValue({});

            await service.prefillSubjectNames(1, {
                contact_role: 'other',
                couple_type: 'bride_bride',
                bride_first_name: 'Alice',
                bride_last_name: 'Jones',
                bride2_first_name: 'Beth',
                bride2_last_name: 'Jones',
            }, 'Mother of Bride');

            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { real_name: 'Alice Jones' },
            });
            expect(prisma.projectDaySubject.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { real_name: 'Beth Jones' },
            });
        });
    });
});
