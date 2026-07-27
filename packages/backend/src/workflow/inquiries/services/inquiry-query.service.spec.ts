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
    selected_package_id: 5,
    contact_id: 10,
    event_category: 'Wedding',
    created_at: new Date(),
    updated_at: new Date(),
    package_contents_snapshot: null,
    contact: { first_name: 'Alex', last_name: 'Taylor', email: 'alex@example.com', phone_number: null },
    selected_package: { id: 5, name: 'Gold', currency: 'GBP' },
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
        service = module.get<InquiryQueryService>(InquiryQueryService);
    });

    describe('findAll blueprint_drift batching', () => {
        it('computes drift for multiple inquiries with a single blueprint query batch', async () => {
            const snapshot = {
                source_day_blueprint_id: 100,
                source_day_blueprint_version_id: 200,
                source_day_blueprint_version_number: 3,
            };
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({ id: 1, package_contents_snapshot: snapshot }),
                baseListInquiry({ id: 2, package_contents_snapshot: snapshot }),
                baseListInquiry({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 100, latest_published_version_id: 201 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 201, version_number: 4 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 200,
                consumed_version_number: 3,
                latest_version_id: 201,
                latest_version_number: 4,
                is_current: false,
            });
            expect(results[1].blueprint_drift?.is_current).toBe(false);
            expect(results[2].blueprint_drift).toBeNull();
        });

        it('marks blueprint drift as current when consumed version matches latest', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    package_contents_snapshot: {
                        source_day_blueprint_id: 10,
                        source_day_blueprint_version_id: 55,
                        source_day_blueprint_version_number: 2,
                    },
                }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 10, latest_published_version_id: 55 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 55, version_number: 2 },
            ]);

            const [result] = await service.findAll(1);
            expect(result.blueprint_drift?.is_current).toBe(true);
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
            prisma.dayBlueprint.findMany.mockResolvedValue([]);

            const [result] = await service.findAll(1);
            expect(result.pipeline_stage).toBe('Proposal');
        });

        it('falls back to estimate status when no task groups exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    estimates: [{ id: 1, total_amount: 1000, tax_rate: 0, status: 'Sent', is_primary: true, created_at: new Date() }],
                }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([]);

            const [result] = await service.findAll(1);
            expect(result.pipeline_stage).toBe('Estimate Sent');
        });
    });

    describe('getDiscoveryCall', () => {
        it('returns the next upcoming discovery call when one exists', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 7 });
            const upcoming = {
                id: 99,
                title: 'Discovery',
                start_time: new Date('2026-08-10T10:00:00Z'),
                end_time: new Date('2026-08-10T11:00:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            await expect(service.getDiscoveryCall(7, 1)).resolves.toEqual(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 7,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });

        it('falls back to the most recent past discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 7 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 50,
                    title: 'Past discovery',
                    start_time: new Date('2026-01-01T10:00:00Z'),
                    end_time: new Date('2026-01-01T11:00:00Z'),
                    meeting_type: 'phone',
                    meeting_url: null,
                    location: null,
                    is_confirmed: false,
                });

            const result = await service.getDiscoveryCall(7, 1);
            expect(result?.title).toBe('Past discovery');
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });

        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(404, 1)).rejects.toThrow(NotFoundException);
        });
    });
});
