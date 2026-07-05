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

    describe('findAll blueprint drift batching', () => {
        it('attaches per-inquiry drift without N+1 blueprint lookups', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 1,
                    status: 'New',
                    wedding_date: new Date('2026-08-01'),
                    notes: null,
                    lead_source: null,
                    lead_source_details: null,
                    selected_package_id: null,
                    contact_id: 10,
                    created_at: new Date(),
                    updated_at: new Date(),
                    event_category: 'Wedding',
                    package_contents_snapshot: {
                        source_day_blueprint_id: 5,
                        source_day_blueprint_version_id: 20,
                        source_day_blueprint_version_number: 1,
                    },
                    contact: { first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: null },
                    selected_package: null,
                    estimates: [],
                    quotes: [],
                    proposals: [],
                    contracts: [],
                    schedule_location_slots: [],
                    inquiry_tasks: [],
                    schedule_day_crew_slots: [],
                },
                {
                    id: 2,
                    status: 'New',
                    wedding_date: null,
                    notes: null,
                    lead_source: null,
                    lead_source_details: null,
                    selected_package_id: null,
                    contact_id: 11,
                    created_at: new Date(),
                    updated_at: new Date(),
                    event_category: null,
                    package_contents_snapshot: null,
                    contact: { first_name: 'C', last_name: 'D', email: 'c@d.com', phone_number: null },
                    selected_package: null,
                    estimates: [],
                    quotes: [],
                    proposals: [],
                    contracts: [],
                    schedule_location_slots: [],
                    inquiry_tasks: [],
                    schedule_day_crew_slots: [],
                },
            ]);

            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 5, latest_published_version_id: 21 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 21, version_number: 2 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 5,
                consumed_version_id: 20,
                consumed_version_number: 1,
                latest_version_id: 21,
                latest_version_number: 2,
                is_current: false,
            });
            expect(results[1].blueprint_drift).toBeNull();
        });

        it('derives pipeline_stage from active task group children', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 3,
                    status: 'New',
                    wedding_date: null,
                    notes: null,
                    lead_source: null,
                    lead_source_details: null,
                    selected_package_id: null,
                    contact_id: 12,
                    created_at: new Date(),
                    updated_at: new Date(),
                    event_category: 'Birthday',
                    package_contents_snapshot: null,
                    contact: { first_name: 'E', last_name: 'F', email: 'e@f.com', phone_number: null },
                    selected_package: null,
                    estimates: [],
                    quotes: [],
                    proposals: [],
                    contracts: [],
                    schedule_location_slots: [],
                    inquiry_tasks: [
                        {
                            name: 'Qualify',
                            order_index: 0,
                            children: [{ status: 'Completed' }, { status: 'Completed' }],
                        },
                        {
                            name: 'Proposal',
                            order_index: 1,
                            children: [{ status: 'Completed' }, { status: 'In Progress' }],
                        },
                    ],
                    schedule_day_crew_slots: [],
                },
            ]);

            const results = await service.findAll(1);

            expect(results[0].pipeline_stage).toBe('Proposal');
            expect(results[0].event_type).toBe('Birthday');
        });
    });

    describe('findOne', () => {
        it('throws when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });

        it('computes blueprint drift for detail view', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 7,
                status: 'New',
                wedding_date: new Date('2026-09-01'),
                notes: null,
                lead_source: null,
                lead_source_details: null,
                selected_package_id: null,
                source_package_id: null,
                contact_id: 20,
                package_contents_snapshot: {
                    source_day_blueprint_id: 8,
                    source_day_blueprint_version_id: 30,
                    source_day_blueprint_version_number: 3,
                },
                preferred_payment_schedule_template_id: null,
                event_category: 'Corporate',
                welcome_sent_at: null,
                created_at: new Date(),
                updated_at: new Date(),
                contact: {
                    id: 20,
                    first_name: 'G',
                    last_name: 'H',
                    email: 'g@h.com',
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

            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 30 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 3 });

            const detail = await service.findOne(7, 1);

            expect(detail.blueprint_drift?.is_current).toBe(true);
            expect(detail.event_type).toBe('Corporate');
        });
    });

    describe('getDiscoveryCall', () => {
        it('returns upcoming discovery call when one exists', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 4 });
            const upcoming = {
                id: 100,
                title: 'Discovery',
                start_time: new Date('2026-12-01T10:00:00Z'),
                end_time: new Date('2026-12-01T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValueOnce(upcoming);

            const result = await service.getDiscoveryCall(4, 1);

            expect(result).toEqual(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(1);
        });

        it('falls back to most recent past discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 101,
                    title: 'Past Discovery',
                    start_time: new Date('2025-01-01T10:00:00Z'),
                    end_time: new Date('2025-01-01T10:30:00Z'),
                    meeting_type: 'phone',
                    meeting_url: null,
                    location: null,
                    is_confirmed: false,
                });

            const result = await service.getDiscoveryCall(5, 1);

            expect(result?.title).toBe('Past Discovery');
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });

        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(404, 1)).rejects.toThrow(NotFoundException);
        });
    });
});
