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
    wedding_date: new Date('2026-09-01'),
    notes: null,
    lead_source: null,
    lead_source_details: null,
    contact_id: 10,
    selected_package_id: null,
    event_category: 'Wedding',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
    contact: {
        first_name: 'Alex',
        last_name: 'Taylor',
        email: 'alex@example.com',
        phone_number: null,
    },
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

    describe('findAll', () => {
        it('returns null blueprint_drift when snapshot lacks blueprint lineage', async () => {
            prisma.inquiries.findMany.mockResolvedValue([baseInquiryListRow()]);

            const result = await service.findAll(1);

            expect(result).toHaveLength(1);
            expect(result[0].blueprint_drift).toBeNull();
            expect(result[0].pipeline_stage).toBe('New Lead');
        });

        it('batch-computes blueprint drift without per-row queries', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    id: 1,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 5,
                        source_day_blueprint_version_id: 50,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                baseInquiryListRow({
                    id: 2,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 5,
                        source_day_blueprint_version_id: 51,
                        source_day_blueprint_version_number: 3,
                    },
                }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 5, latest_published_version_id: 51 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 51, version_number: 3 },
            ]);

            const result = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(result[0].blueprint_drift).toEqual({
                blueprint_id: 5,
                consumed_version_id: 50,
                consumed_version_number: 2,
                latest_version_id: 51,
                latest_version_number: 3,
                is_current: false,
            });
            expect(result[1].blueprint_drift?.is_current).toBe(true);
        });

        it('derives pipeline_stage from active task group children', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    inquiry_tasks: [
                        {
                            name: 'Inquiry',
                            order_index: 0,
                            children: [{ status: 'Completed' }, { status: 'Completed' }],
                        },
                        {
                            name: 'Discovery',
                            order_index: 1,
                            children: [{ status: 'In Progress' }],
                        },
                    ],
                }),
            ]);

            const result = await service.findAll(1);

            expect(result[0].pipeline_stage).toBe('Discovery');
        });

        it('falls back to contract stage when no task groups exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    contracts: [{ status: 'Sent' }],
                }),
            ]);

            const result = await service.findAll(1);

            expect(result[0].pipeline_stage).toBe('Contract Stage');
        });
    });

    describe('findOne', () => {
        const detailInquiry = {
            id: 7,
            status: 'New',
            wedding_date: new Date('2026-09-01'),
            notes: 'Notes',
            lead_source: 'Referral',
            lead_source_details: null,
            selected_package_id: 3,
            source_package_id: 3,
            contact_id: 10,
            package_contents_snapshot: null,
            preferred_payment_schedule_template_id: null,
            event_category: 'Birthday',
            welcome_sent_at: null,
            created_at: new Date('2026-01-01'),
            updated_at: new Date('2026-01-02'),
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
        };

        it('throws when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.findOne(99, 1)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('resolves lead producer from crew slot and maps event_type from event_category', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                ...detailInquiry,
                schedule_day_crew_slots: [
                    {
                        id: 1,
                        label: 'Lead',
                        lead_type: 'producer',
                        crew: {
                            id: 20,
                            contact: { first_name: 'Pat', last_name: 'Producer', email: 'pat@example.com' },
                        },
                        job_role: { id: 1, name: 'producer', display_name: 'Producer' },
                    },
                ],
            });

            const result = await service.findOne(7, 1);

            expect(result.event_type).toBe('Birthday');
            expect(result.lead_producer).toEqual({
                id: 20,
                name: 'Pat Producer',
                email: 'pat@example.com',
                label: 'Lead',
                job_role_name: 'Producer',
            });
            expect(result.blueprint_drift).toBeNull();
        });
    });

    describe('getDiscoveryCall', () => {
        it('returns upcoming discovery call when one exists', async () => {
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
            prisma.inquiries.findFirst.mockResolvedValue({ id: 7 });
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(7, 1);

            expect(result).toEqual(upcoming);
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

        it('falls back to most recent past discovery call', async () => {
            const pastCall = {
                id: 101,
                title: 'Past Discovery',
                start_time: new Date('2025-01-01T10:00:00Z'),
                end_time: new Date('2025-01-01T10:30:00Z'),
                meeting_type: 'phone',
                meeting_url: null,
                location: null,
                is_confirmed: false,
            };
            prisma.inquiries.findFirst.mockResolvedValue({ id: 7 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(pastCall);

            const result = await service.getDiscoveryCall(7, 1);

            expect(result).toEqual(pastCall);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });

        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.getDiscoveryCall(7, 1)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
