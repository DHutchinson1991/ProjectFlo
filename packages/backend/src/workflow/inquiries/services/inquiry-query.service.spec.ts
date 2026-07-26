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

    describe('findOne blueprint_drift', () => {
        const baseInquiry = {
            id: 1,
            status: 'Active',
            wedding_date: new Date('2026-08-01'),
            notes: null,
            lead_source: 'WEB',
            lead_source_details: null,
            selected_package_id: 5,
            source_package_id: null,
            contact_id: 10,
            package_contents_snapshot: {
                source_day_blueprint_id: 100,
                source_day_blueprint_version_id: 200,
                source_day_blueprint_version_number: 3,
            },
            preferred_payment_schedule_template_id: null,
            event_category: 'Wedding',
            welcome_sent_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            contact: {
                id: 10,
                first_name: 'Alex',
                last_name: 'Smith',
                email: 'alex@example.com',
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
        };

        it('returns null drift when snapshot has no blueprint ids', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                ...baseInquiry,
                package_contents_snapshot: { name: 'Gold Package' },
            });

            const result = await service.findOne(1, 1);

            expect(result.blueprint_drift).toBeNull();
            expect(prisma.dayBlueprint.findUnique).not.toHaveBeenCalled();
        });

        it('reports is_current true when consumed version matches latest published', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(baseInquiry);
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 200 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 3 });

            const result = await service.findOne(1, 1);

            expect(result.blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 200,
                consumed_version_number: 3,
                latest_version_id: 200,
                latest_version_number: 3,
                is_current: true,
            });
        });

        it('reports is_current false when a newer blueprint version is published', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(baseInquiry);
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 300 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 4 });

            const result = await service.findOne(1, 1);

            expect(result.blueprint_drift?.is_current).toBe(false);
            expect(result.blueprint_drift?.latest_version_id).toBe(300);
            expect(result.blueprint_drift?.consumed_version_id).toBe(200);
        });

        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll blueprint_drift batching', () => {
        it('batches blueprint drift lookups instead of querying per inquiry', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 1,
                    status: 'Active',
                    wedding_date: new Date(),
                    notes: null,
                    lead_source: null,
                    lead_source_details: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                    contact_id: 10,
                    selected_package_id: null,
                    event_category: 'Wedding',
                    contact: { first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: null },
                    selected_package: null,
                    estimates: [],
                    quotes: [],
                    proposals: [],
                    contracts: [],
                    inquiry_tasks: [],
                    schedule_location_slots: [],
                    schedule_day_crew_slots: [],
                    package_contents_snapshot: {
                        source_day_blueprint_id: 100,
                        source_day_blueprint_version_id: 200,
                        source_day_blueprint_version_number: 1,
                    },
                },
                {
                    id: 2,
                    status: 'Active',
                    wedding_date: new Date(),
                    notes: null,
                    lead_source: null,
                    lead_source_details: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                    contact_id: 11,
                    selected_package_id: null,
                    event_category: 'Birthday',
                    contact: { first_name: 'C', last_name: 'D', email: 'c@d.com', phone_number: null },
                    selected_package: null,
                    estimates: [],
                    quotes: [],
                    proposals: [],
                    contracts: [],
                    inquiry_tasks: [],
                    schedule_location_slots: [],
                    schedule_day_crew_slots: [],
                    package_contents_snapshot: {
                        source_day_blueprint_id: 100,
                        source_day_blueprint_version_id: 250,
                        source_day_blueprint_version_number: 2,
                    },
                },
                {
                    id: 3,
                    status: 'Active',
                    wedding_date: new Date(),
                    notes: null,
                    lead_source: null,
                    lead_source_details: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                    contact_id: 12,
                    selected_package_id: null,
                    event_category: null,
                    contact: { first_name: 'E', last_name: 'F', email: 'e@f.com', phone_number: null },
                    selected_package: null,
                    estimates: [],
                    quotes: [],
                    proposals: [],
                    contracts: [],
                    inquiry_tasks: [],
                    schedule_location_slots: [],
                    schedule_day_crew_slots: [],
                    package_contents_snapshot: null,
                },
            ]);

            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 100, latest_published_version_id: 300 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 300, version_number: 3 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprint.findUnique).not.toHaveBeenCalled();

            expect(results[0].blueprint_drift?.is_current).toBe(false);
            expect(results[1].blueprint_drift?.is_current).toBe(false);
            expect(results[2].blueprint_drift).toBeNull();
        });
    });

    describe('getDiscoveryCall', () => {
        it('returns upcoming discovery call when one exists', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });
            const upcoming = {
                id: 20,
                title: 'Discovery',
                start_time: new Date('2026-12-01'),
                end_time: new Date('2026-12-01'),
                meeting_type: 'VIDEO',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(5, 1);

            expect(result).toEqual(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 5,
                        event_type: 'DISCOVERY_CALL',
                    }),
                }),
            );
        });

        it('falls back to most recent past discovery call when none are upcoming', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });
            const pastCall = {
                id: 21,
                title: 'Past Discovery',
                start_time: new Date('2025-06-01'),
                end_time: new Date('2025-06-01'),
                meeting_type: 'PHONE',
                meeting_url: null,
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(pastCall);

            const result = await service.getDiscoveryCall(5, 1);

            expect(result).toEqual(pastCall);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
            expect(prisma.calendar_events.findFirst).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    orderBy: { start_time: 'desc' },
                }),
            );
        });

        it('throws when inquiry not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(5, 1)).rejects.toThrow(NotFoundException);
        });
    });
});
