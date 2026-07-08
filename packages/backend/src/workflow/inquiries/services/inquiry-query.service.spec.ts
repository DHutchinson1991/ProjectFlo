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

const listInquiry = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: 'New',
    wedding_date: new Date('2026-06-01'),
    notes: null,
    lead_source: 'WEB',
    lead_source_details: null,
    selected_package_id: 5,
    contact_id: 20,
    package_contents_snapshot: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
    event_category: 'Wedding',
    contact: {
        first_name: 'Alex',
        last_name: 'Taylor',
        email: 'alex@example.com',
        phone_number: '555-0100',
    },
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
        service = module.get(InquiryQueryService);
    });

    describe('findAll', () => {
        it('computes blueprint drift in batch without N+1 queries', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                listInquiry({
                    id: 1,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 100,
                        source_day_blueprint_version_id: 200,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                listInquiry({
                    id: 2,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 100,
                        source_day_blueprint_version_id: 201,
                        source_day_blueprint_version_number: 3,
                    },
                }),
                listInquiry({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 100, latest_published_version_id: 201 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 201, version_number: 3 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 200,
                consumed_version_number: 2,
                latest_version_id: 201,
                latest_version_number: 3,
                is_current: false,
            });
            expect(results[1].blueprint_drift?.is_current).toBe(true);
            expect(results[2].blueprint_drift).toBeNull();
        });

        it('derives pipeline stage from active task groups when present', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                listInquiry({
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

        it('falls back to financial stage when no task groups exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                listInquiry({
                    estimates: [{ id: 1, total_amount: 1000, tax_rate: 20, status: 'Sent', is_primary: true, created_at: new Date() }],
                }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([]);

            const [result] = await service.findAll(1);

            expect(result.pipeline_stage).toBe('Estimate Sent');
        });
    });

    describe('findOne', () => {
        it('throws when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.findOne(404, 1)).rejects.toThrow(NotFoundException);
        });

        it('includes blueprint drift for detail view', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 1,
                status: 'New',
                wedding_date: new Date('2026-06-01'),
                notes: null,
                lead_source: 'WEB',
                lead_source_details: null,
                selected_package_id: 5,
                source_package_id: null,
                contact_id: 20,
                package_contents_snapshot: {
                    source_day_blueprint_id: 100,
                    source_day_blueprint_version_id: 200,
                    source_day_blueprint_version_number: 2,
                },
                preferred_payment_schedule_template_id: null,
                event_category: 'Wedding',
                welcome_sent_at: null,
                created_at: new Date('2026-01-01'),
                updated_at: new Date('2026-01-02'),
                contact: {
                    id: 20,
                    first_name: 'Alex',
                    last_name: 'Taylor',
                    email: 'alex@example.com',
                    phone_number: '555-0100',
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
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 200 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 2 });

            const result = await service.findOne(1, 1);

            expect(result.blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 200,
                consumed_version_number: 2,
                latest_version_id: 200,
                latest_version_number: 2,
                is_current: true,
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.getDiscoveryCall(9, 1)).rejects.toThrow(NotFoundException);
        });

        it('prefers the next upcoming discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 9 });
            const upcoming = {
                id: 50,
                title: 'Upcoming call',
                start_time: new Date('2026-12-01T10:00:00Z'),
                end_time: new Date('2026-12-01T11:00:00Z'),
                meeting_type: 'VIDEO',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(9, 1);

            expect(result).toEqual(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 9,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });

        it('falls back to the most recent past discovery call when none are upcoming', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 9 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 40,
                    title: 'Past call',
                    start_time: new Date('2025-01-01T10:00:00Z'),
                    end_time: new Date('2025-01-01T11:00:00Z'),
                    meeting_type: 'PHONE',
                    meeting_url: null,
                    location: null,
                    is_confirmed: false,
                });

            const result = await service.getDiscoveryCall(9, 1);

            expect(result?.title).toBe('Past call');
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });
    });
});
