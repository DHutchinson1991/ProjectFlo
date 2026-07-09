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

const baseListInquiry = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: 'New',
    wedding_date: new Date('2026-08-01'),
    notes: null,
    lead_source: 'WEB',
    lead_source_details: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
    contact_id: 5,
    selected_package_id: null,
    event_category: 'Wedding',
    package_contents_snapshot: null,
    contact: {
        first_name: 'Alex',
        last_name: 'Taylor',
        email: 'alex@example.com',
        phone_number: '555-0100',
    },
    selected_package: null,
    estimates: [],
    quotes: [],
    proposals: [],
    contracts: [],
    inquiry_tasks: [],
    schedule_location_slots: [],
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
        service = module.get<InquiryQueryService>(InquiryQueryService);
    });

    describe('findAll blueprint_drift batching', () => {
        it('batches blueprint drift lookups instead of querying per inquiry', async () => {
            const snapshotA = {
                source_day_blueprint_id: 10,
                source_day_blueprint_version_id: 100,
                source_day_blueprint_version_number: 2,
            };
            const snapshotB = {
                source_day_blueprint_id: 10,
                source_day_blueprint_version_id: 101,
                source_day_blueprint_version_number: 3,
            };

            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({ id: 1, package_contents_snapshot: snapshotA }),
                baseListInquiry({ id: 2, package_contents_snapshot: snapshotB }),
                baseListInquiry({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 10, latest_published_version_id: 101 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 101, version_number: 3 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledWith({
                where: { id: { in: [10] } },
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
            expect(results[1].blueprint_drift?.is_current).toBe(true);
            expect(results[2].blueprint_drift).toBeNull();
        });

        it('returns null drift for invalid snapshots without hitting the database', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({ package_contents_snapshot: 'not-an-object' }),
                baseListInquiry({ package_contents_snapshot: { source_day_blueprint_id: 1 } }),
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
            expect(results.every((r: { blueprint_drift: unknown }) => r.blueprint_drift === null)).toBe(true);
        });
    });

    describe('findAll pipeline_stage', () => {
        it('derives pipeline stage from active task group children', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    inquiry_tasks: [
                        {
                            name: 'Qualify',
                            order_index: 0,
                            children: [{ status: 'Completed' }, { status: 'Completed' }],
                        },
                        {
                            name: 'Proposal',
                            order_index: 1,
                            children: [{ status: 'In Progress' }],
                        },
                    ],
                }),
            ]);

            const [result] = await service.findAll(1);
            expect(result.pipeline_stage).toBe('Proposal');
        });

        it('falls back to financial artifact heuristics when no task groups exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    estimates: [{ id: 1, total_amount: 1000, tax_rate: 20, status: 'Sent' }],
                }),
            ]);

            const [result] = await service.findAll(1);
            expect(result.pipeline_stage).toBe('Estimate Sent');
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });

        it('includes blueprint drift for detail view', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 1,
                status: 'New',
                wedding_date: new Date('2026-08-01'),
                notes: null,
                lead_source: 'WEB',
                lead_source_details: null,
                selected_package_id: null,
                source_package_id: null,
                contact_id: 5,
                package_contents_snapshot: {
                    source_day_blueprint_id: 7,
                    source_day_blueprint_version_id: 70,
                    source_day_blueprint_version_number: 1,
                },
                preferred_payment_schedule_template_id: null,
                event_category: 'Corporate',
                welcome_sent_at: null,
                created_at: new Date(),
                updated_at: new Date(),
                contact: {
                    id: 5,
                    first_name: 'Sam',
                    last_name: 'Lee',
                    email: 'sam@example.com',
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
            prisma.dayBlueprint.findUnique.mockResolvedValue({
                latest_published_version_id: 70,
            });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({
                version_number: 1,
            });

            const result = await service.findOne(1, 1);

            expect(result.event_type).toBe('Corporate');
            expect(result.blueprint_drift).toEqual({
                blueprint_id: 7,
                consumed_version_id: 70,
                consumed_version_number: 1,
                latest_version_id: 70,
                latest_version_number: 1,
                is_current: true,
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('throws when inquiry does not belong to brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(1, 2)).rejects.toThrow(NotFoundException);
        });

        it('prefers upcoming discovery call over past events', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            const upcoming = {
                id: 50,
                title: 'Upcoming call',
                start_time: new Date('2099-01-01'),
                end_time: new Date('2099-01-01'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(1, 1);

            expect(result).toBe(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 1,
                        event_type: 'DISCOVERY_CALL',
                        start_time: { gte: expect.any(Date) },
                    }),
                }),
            );
        });

        it('falls back to most recent past discovery call when none are upcoming', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 40,
                    title: 'Past call',
                    start_time: new Date('2020-01-01'),
                    end_time: new Date('2020-01-01'),
                    meeting_type: 'phone',
                    meeting_url: null,
                    location: null,
                    is_confirmed: true,
                });

            const result = await service.getDiscoveryCall(1, 1);

            expect(result?.title).toBe('Past call');
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });
    });
});
