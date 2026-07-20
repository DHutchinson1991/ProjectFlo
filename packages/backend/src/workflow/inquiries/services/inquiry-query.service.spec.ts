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

const baseInquiryListRow = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: 'New',
    wedding_date: new Date('2026-08-15'),
    notes: null,
    lead_source: 'WEBSITE',
    lead_source_details: null,
    selected_package_id: 5,
    contact_id: 10,
    package_contents_snapshot: null,
    event_category: 'Wedding',
    created_at: new Date(),
    updated_at: new Date(),
    contact: {
        first_name: 'Alex',
        last_name: 'Taylor',
        email: 'alex@example.com',
        phone_number: null,
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
        service = module.get<InquiryQueryService>(InquiryQueryService);
    });

    describe('findAll blueprint drift batching', () => {
        it('returns null drift when snapshot lacks blueprint lineage', async () => {
            prisma.inquiries.findMany.mockResolvedValue([baseInquiryListRow()]);

            const results = await service.findAll(1);

            expect(results).toHaveLength(1);
            expect(results[0].blueprint_drift).toBeNull();
            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
        });

        it('batches blueprint drift lookups across inquiries', async () => {
            const currentSnapshot = {
                source_day_blueprint_id: 100,
                source_day_blueprint_version_id: 10,
                source_day_blueprint_version_number: 2,
            };
            const staleSnapshot = {
                source_day_blueprint_id: 200,
                source_day_blueprint_version_id: 20,
                source_day_blueprint_version_number: 1,
            };

            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({ id: 1, package_contents_snapshot: currentSnapshot }),
                baseInquiryListRow({ id: 2, package_contents_snapshot: staleSnapshot }),
                baseInquiryListRow({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 100, latest_published_version_id: 10 },
                { id: 200, latest_published_version_id: 21 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 10, version_number: 2 },
                { id: 21, version_number: 3 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 10,
                consumed_version_number: 2,
                latest_version_id: 10,
                latest_version_number: 2,
                is_current: true,
            });
            expect(results[1].blueprint_drift).toEqual({
                blueprint_id: 200,
                consumed_version_id: 20,
                consumed_version_number: 1,
                latest_version_id: 21,
                latest_version_number: 3,
                is_current: false,
            });
            expect(results[2].blueprint_drift).toBeNull();
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });

        it('computes blueprint drift for detail view', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 1,
                status: 'New',
                wedding_date: new Date('2026-08-15'),
                notes: null,
                lead_source: 'WEBSITE',
                lead_source_details: null,
                selected_package_id: 5,
                source_package_id: null,
                contact_id: 10,
                package_contents_snapshot: {
                    source_day_blueprint_id: 100,
                    source_day_blueprint_version_id: 10,
                    source_day_blueprint_version_number: 2,
                },
                preferred_payment_schedule_template_id: null,
                event_category: 'Corporate',
                welcome_sent_at: null,
                created_at: new Date(),
                updated_at: new Date(),
                contact: {
                    id: 10,
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
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 11 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 3 });

            const detail = await service.findOne(1, 1);

            expect(detail.event_type).toBe('Corporate');
            expect(detail.blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 10,
                consumed_version_number: 2,
                latest_version_id: 11,
                latest_version_number: 3,
                is_current: false,
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('throws when inquiry does not belong to brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(1, 99)).rejects.toThrow(NotFoundException);
        });

        it('prefers the next upcoming discovery call', async () => {
            const upcoming = {
                id: 50,
                title: 'Discovery Call',
                start_time: new Date('2026-08-20T14:00:00Z'),
                end_time: new Date('2026-08-20T14:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com/abc',
                location: null,
                is_confirmed: true,
            };

            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(1, 1);

            expect(result).toEqual(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 1,
                        event_type: 'DISCOVERY_CALL',
                    }),
                }),
            );
        });

        it('falls back to the most recent past discovery call when none are upcoming', async () => {
            const pastCall = {
                id: 51,
                title: 'Discovery Call',
                start_time: new Date('2026-07-01T14:00:00Z'),
                end_time: new Date('2026-07-01T14:30:00Z'),
                meeting_type: 'phone',
                meeting_url: null,
                location: null,
                is_confirmed: true,
            };

            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(pastCall);

            const result = await service.getDiscoveryCall(1, 1);

            expect(result).toEqual(pastCall);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });
    });

    describe('pipeline stage mapping', () => {
        it('derives pipeline stage from active task groups', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    inquiry_tasks: [
                        {
                            name: 'Qualify',
                            order_index: 1,
                            children: [{ status: 'Completed' }, { status: 'Completed' }],
                        },
                        {
                            name: 'Proposal',
                            order_index: 2,
                            children: [{ status: 'Completed' }, { status: 'In Progress' }],
                        },
                    ],
                }),
            ]);

            const [result] = await service.findAll(1);

            expect(result.pipeline_stage).toBe('Proposal');
            expect(result.pipeline_stages).toEqual([
                { name: 'Qualify', order_index: 1, total_children: 2, completed_children: 2 },
                { name: 'Proposal', order_index: 2, total_children: 2, completed_children: 1 },
            ]);
        });

        it('falls back to financial workflow stage when no task groups exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    estimates: [{ id: 1, total_amount: 1000, tax_rate: 0, status: 'Sent' }],
                }),
            ]);

            const [result] = await service.findAll(1);

            expect(result.pipeline_stage).toBe('Estimate Sent');
        });
    });
});
