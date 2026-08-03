import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryQueryService } from './inquiry-query.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const buildPrisma = () => ({
    inquiries: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
    dayBlueprint: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    dayBlueprintVersion: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    calendar_events: {
        findFirst: jest.fn(),
    },
});

const listInquiryBase = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: 'New',
    wedding_date: new Date('2026-09-01'),
    notes: null,
    lead_source: 'WEB',
    lead_source_details: null,
    selected_package_id: null,
    contact_id: 10,
    package_contents_snapshot: null,
    created_at: new Date(),
    updated_at: new Date(),
    event_category: 'Wedding',
    contact: { first_name: 'Alex', last_name: 'Smith', email: 'alex@example.com', phone_number: null },
    selected_package: null,
    estimates: [],
    quotes: [],
    proposals: [],
    contracts: [],
    schedule_location_slots: [],
    inquiry_tasks: [],
    schedule_day_crew_slots: [],
    ...overrides,
});

describe('InquiryQueryService', () => {
    let service: InquiryQueryService;
    let prisma: ReturnType<typeof buildPrisma>;

    beforeEach(async () => {
        prisma = buildPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryQueryService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get(InquiryQueryService);
    });

    describe('findAll', () => {
        it('returns null blueprint_drift when snapshot has no blueprint lineage', async () => {
            prisma.inquiries.findMany.mockResolvedValue([listInquiryBase()]);

            const results = await service.findAll(1);

            expect(results).toHaveLength(1);
            expect(results[0].blueprint_drift).toBeNull();
            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
        });

        it('batches blueprint drift lookups and flags stale consumed versions', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                listInquiryBase({
                    id: 1,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 100,
                        source_day_blueprint_version_id: 5,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                listInquiryBase({
                    id: 2,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 100,
                        source_day_blueprint_version_id: 9,
                        source_day_blueprint_version_number: 4,
                    },
                }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 100, latest_published_version_id: 9 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 9, version_number: 4 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 5,
                consumed_version_number: 2,
                latest_version_id: 9,
                latest_version_number: 4,
                is_current: false,
            });
            expect(results[1].blueprint_drift?.is_current).toBe(true);
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });

        it('computes blueprint_drift for detail view', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 1,
                status: 'New',
                wedding_date: new Date('2026-09-01'),
                notes: null,
                lead_source: 'WEB',
                lead_source_details: null,
                selected_package_id: null,
                source_package_id: null,
                contact_id: 10,
                package_contents_snapshot: {
                    source_day_blueprint_id: 50,
                    source_day_blueprint_version_id: 7,
                    source_day_blueprint_version_number: 3,
                },
                preferred_payment_schedule_template_id: null,
                event_category: 'Birthday',
                welcome_sent_at: null,
                created_at: new Date(),
                updated_at: new Date(),
                contact: {
                    id: 10,
                    first_name: 'Jamie',
                    last_name: 'Lee',
                    email: 'jamie@example.com',
                    phone_number: null,
                    company_name: null,
                    brand_id: 1,
                },
                estimates: [],
                proposals: [],
                quotes: [],
                contracts: [],
                invoices: [],
                schedule_location_slots: [],
                schedule_day_crew_slots: [],
                inquiry_tasks: [],
            });
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 7 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 3 });

            const result = await service.findOne(1, 1);

            expect(result.event_type).toBe('Birthday');
            expect(result.blueprint_drift).toEqual({
                blueprint_id: 50,
                consumed_version_id: 7,
                consumed_version_number: 3,
                latest_version_id: 7,
                latest_version_number: 3,
                is_current: true,
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('returns the next upcoming discovery call when one exists', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });
            const upcoming = {
                id: 20,
                title: 'Discovery',
                start_time: new Date('2026-09-10T10:00:00Z'),
                end_time: new Date('2026-09-10T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValueOnce(upcoming);

            const result = await service.getDiscoveryCall(5, 1);

            expect(result).toEqual(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(1);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 5,
                        event_type: 'DISCOVERY_CALL',
                    }),
                }),
            );
        });

        it('falls back to the most recent past discovery call when none are upcoming', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });
            const pastCall = {
                id: 21,
                title: 'Past discovery',
                start_time: new Date('2026-01-01T10:00:00Z'),
                end_time: new Date('2026-01-01T10:30:00Z'),
                meeting_type: 'phone',
                meeting_url: null,
                location: null,
                is_confirmed: false,
            };
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(pastCall);

            const result = await service.getDiscoveryCall(5, 1);

            expect(result).toEqual(pastCall);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });

        it('throws NotFoundException when inquiry does not belong to brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.getDiscoveryCall(5, 1)).rejects.toThrow(NotFoundException);
        });
    });
});
