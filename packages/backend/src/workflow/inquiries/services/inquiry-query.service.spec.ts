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

const minimalListInquiry = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: 'New',
    wedding_date: new Date('2026-08-01'),
    notes: null,
    lead_source: null,
    lead_source_details: null,
    selected_package_id: null,
    contact_id: 5,
    event_category: 'Wedding',
    created_at: new Date(),
    updated_at: new Date(),
    contact: { first_name: 'Alex', last_name: 'Taylor', email: 'alex@example.com', phone_number: null },
    selected_package: null,
    estimates: [],
    quotes: [],
    proposals: [],
    contracts: [],
    schedule_location_slots: [],
    inquiry_tasks: [],
    schedule_day_crew_slots: [],
    package_contents_snapshot: null,
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

    describe('findAll blueprint drift batching', () => {
        it('returns null drift for invalid or missing snapshots', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                minimalListInquiry({ id: 1, package_contents_snapshot: null }),
                minimalListInquiry({ id: 2, package_contents_snapshot: 'not-an-object' }),
                minimalListInquiry({ id: 3, package_contents_snapshot: { source_day_blueprint_id: 10 } }),
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
            expect(results).toHaveLength(3);
            expect(results.every((row: { blueprint_drift: unknown }) => row.blueprint_drift === null)).toBe(true);
        });

        it('batches blueprint drift lookups instead of querying per inquiry', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                minimalListInquiry({
                    id: 1,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 10,
                        source_day_blueprint_version_id: 100,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                minimalListInquiry({
                    id: 2,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 10,
                        source_day_blueprint_version_id: 100,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                minimalListInquiry({
                    id: 3,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 20,
                        source_day_blueprint_version_id: 200,
                        source_day_blueprint_version_number: 1,
                    },
                }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 10, latest_published_version_id: 101 },
                { id: 20, latest_published_version_id: 200 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 101, version_number: 3 },
                { id: 200, version_number: 1 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledWith({
                where: { id: { in: [10, 20] } },
                select: { id: true, latest_published_version_id: true },
            });
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);

            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 10,
                consumed_version_id: 100,
                consumed_version_number: 2,
                latest_version_id: 101,
                latest_version_number: 3,
                is_current: false,
            });
            expect(results[2].blueprint_drift).toEqual({
                blueprint_id: 20,
                consumed_version_id: 200,
                consumed_version_number: 1,
                latest_version_id: 200,
                latest_version_number: 1,
                is_current: true,
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('returns upcoming discovery call when one exists', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 42 });
            const upcoming = {
                id: 7,
                title: 'Discovery Call',
                start_time: new Date('2026-08-10T14:00:00Z'),
                end_time: new Date('2026-08-10T14:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com/abc',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValueOnce(upcoming);

            const result = await service.getDiscoveryCall(42, 1);

            expect(result).toBe(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(1);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 42,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });

        it('falls back to most recent past call when no upcoming call exists', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 42 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 3,
                    title: 'Past Discovery Call',
                    start_time: new Date('2026-07-01T10:00:00Z'),
                    end_time: new Date('2026-07-01T10:30:00Z'),
                    meeting_type: 'phone',
                    meeting_url: null,
                    location: null,
                    is_confirmed: true,
                });

            const result = await service.getDiscoveryCall(42, 1);

            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
            expect(result?.title).toBe('Past Discovery Call');
        });

        it('throws when inquiry is not found', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.getDiscoveryCall(99, 1)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
