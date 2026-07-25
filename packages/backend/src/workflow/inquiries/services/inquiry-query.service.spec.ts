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
    wedding_date: new Date('2026-09-01'),
    notes: null,
    lead_source: 'WEBSITE',
    lead_source_details: null,
    selected_package_id: 5,
    contact_id: 10,
    event_category: 'Wedding',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
    contact: {
        first_name: 'Alex',
        last_name: 'Smith',
        email: 'alex@example.com',
        phone_number: '555-0100',
    },
    selected_package: { id: 5, name: 'Gold', currency: 'GBP' },
    estimates: [],
    quotes: [],
    proposals: [],
    contracts: [],
    inquiry_tasks: [],
    schedule_location_slots: [],
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
            prisma.inquiries.findMany.mockResolvedValue([baseListInquiry()]);

            const result = await service.findAll(1);

            expect(result).toHaveLength(1);
            expect(result[0].blueprint_drift).toBeNull();
            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
        });

        it('batches blueprint drift lookups and flags outdated consumed versions', async () => {
            const snapshot = {
                source_day_blueprint_id: 100,
                source_day_blueprint_version_id: 10,
                source_day_blueprint_version_number: 2,
            };
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({ id: 1, package_contents_snapshot: snapshot }),
                baseListInquiry({ id: 2, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 100, latest_published_version_id: 11 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 11, version_number: 3 },
            ]);

            const result = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(result[0].blueprint_drift).toEqual({
                blueprint_id: 100,
                consumed_version_id: 10,
                consumed_version_number: 2,
                latest_version_id: 11,
                latest_version_number: 3,
                is_current: false,
            });
            expect(result[1].blueprint_drift).toBeNull();
        });

        it('derives pipeline_stage from active task groups when present', async () => {
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
                            children: [{ status: 'Completed' }, { status: 'In Progress' }],
                        },
                    ],
                }),
            ]);

            const result = await service.findAll(1);

            expect(result[0].pipeline_stage).toBe('Proposal');
        });

        it('falls back to estimate/contract status when no task groups exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    estimates: [{ id: 1, total_amount: 1000, tax_rate: 20, status: 'Sent', is_primary: true }],
                }),
            ]);

            const result = await service.findAll(1);

            expect(result[0].pipeline_stage).toBe('Estimate Sent');
        });
    });

    describe('findOne', () => {
        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.findOne(99, 1)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('computes blueprint drift for detail view', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 1,
                status: 'New',
                wedding_date: new Date('2026-09-01'),
                notes: null,
                lead_source: 'WEBSITE',
                lead_source_details: null,
                selected_package_id: 5,
                source_package_id: null,
                contact_id: 10,
                package_contents_snapshot: {
                    source_day_blueprint_id: 50,
                    source_day_blueprint_version_id: 5,
                    source_day_blueprint_version_number: 1,
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
            });
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 5 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 1 });

            const result = await service.findOne(1, 1);

            expect(result.blueprint_drift).toEqual({
                blueprint_id: 50,
                consumed_version_id: 5,
                consumed_version_number: 1,
                latest_version_id: 5,
                latest_version_number: 1,
                is_current: true,
            });
        });

        it('resolves lead crew from schedule slots with job-role fallback', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 1,
                status: 'New',
                wedding_date: null,
                notes: null,
                lead_source: null,
                lead_source_details: null,
                selected_package_id: null,
                source_package_id: null,
                contact_id: 10,
                package_contents_snapshot: null,
                preferred_payment_schedule_template_id: null,
                event_category: null,
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
                schedule_day_crew_slots: [
                    {
                        id: 1,
                        label: 'Lead',
                        lead_type: null,
                        crew: {
                            id: 7,
                            contact: { first_name: 'Jamie', last_name: 'Lee', email: 'jamie@example.com' },
                        },
                        job_role: { id: 2, name: 'videographer', display_name: 'Videographer' },
                    },
                ],
                inquiry_tasks: [],
            });

            const result = await service.findOne(1, 1);

            expect(result.lead_videographer).toEqual({
                id: 7,
                name: 'Jamie Lee',
                email: 'jamie@example.com',
                label: 'Lead',
                job_role_name: 'Videographer',
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.getDiscoveryCall(1, 99)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('prefers the next upcoming discovery call', async () => {
            const upcoming = {
                id: 20,
                title: 'Discovery',
                start_time: new Date('2026-08-01T10:00:00Z'),
                end_time: new Date('2026-08-01T10:30:00Z'),
                meeting_type: 'VIDEO',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(1, 1);

            expect(result).toBe(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 1,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });

        it('falls back to the most recent past discovery call when none are upcoming', async () => {
            const past = {
                id: 21,
                title: 'Past discovery',
                start_time: new Date('2025-01-01T10:00:00Z'),
                end_time: new Date('2025-01-01T10:30:00Z'),
                meeting_type: 'PHONE',
                meeting_url: null,
                location: null,
                is_confirmed: true,
            };
            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(past);

            const result = await service.getDiscoveryCall(1, 1);

            expect(result).toBe(past);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });
    });
});
