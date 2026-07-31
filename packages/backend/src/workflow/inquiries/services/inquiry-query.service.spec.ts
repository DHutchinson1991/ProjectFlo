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
    wedding_date: new Date('2026-06-15'),
    notes: null,
    lead_source: 'WEBSITE',
    lead_source_details: null,
    selected_package_id: 5,
    contact_id: 10,
    event_category: 'Wedding',
    created_at: new Date(),
    updated_at: new Date(),
    package_contents_snapshot: null,
    contact: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', phone_number: null },
    selected_package: { id: 5, name: 'Gold', currency: 'GBP' },
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

    describe('findAll', () => {
        it('returns null blueprint_drift when snapshot lacks blueprint ids', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({ package_contents_snapshot: { package_id: 1 } }),
            ]);

            const results = await service.findAll(1);

            expect(results).toHaveLength(1);
            expect(results[0].blueprint_drift).toBeNull();
            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
        });

        it('batches blueprint drift lookups across inquiries', async () => {
            const snapshot = {
                source_day_blueprint_id: 100,
                source_day_blueprint_version_id: 200,
                source_day_blueprint_version_number: 3,
            };
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({ id: 1, package_contents_snapshot: snapshot }),
                baseInquiryListRow({ id: 2, package_contents_snapshot: snapshot }),
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
        });

        it('derives pipeline_stage from active task group children', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    inquiry_tasks: [
                        {
                            name: 'Intake',
                            order_index: 0,
                            children: [{ status: 'Completed' }, { status: 'Completed' }],
                        },
                        {
                            name: 'Proposal',
                            order_index: 1,
                            children: [{ status: 'In Progress' }, { status: 'Pending' }],
                        },
                    ],
                }),
            ]);

            const results = await service.findAll(1);

            expect(results[0].pipeline_stage).toBe('Proposal');
        });

        it('falls back to financial workflow stage when no task groups exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    estimates: [{ id: 1, total_amount: 1000, tax_rate: 0, status: 'Sent', is_primary: true, created_at: new Date() }],
                }),
            ]);

            const results = await service.findAll(1);

            expect(results[0].pipeline_stage).toBe('Estimate Sent');
        });

        it('resolves lead crew names from schedule slots', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    schedule_day_crew_slots: [
                        {
                            lead_type: 'producer',
                            job_role: { name: 'producer' },
                            crew: { contact: { first_name: 'Alex', last_name: 'Smith' } },
                        },
                        {
                            lead_type: null,
                            job_role: { name: 'videographer' },
                            crew: { contact: { first_name: 'Sam', last_name: 'Lee' } },
                        },
                    ],
                }),
            ]);

            const results = await service.findAll(1);

            expect(results[0].lead_producer_name).toBe('Alex Smith');
            expect(results[0].lead_videographer_name).toBe('Sam Lee');
        });
    });

    describe('findOne', () => {
        const baseDetailInquiry = (overrides: Record<string, unknown> = {}) => ({
            id: 1,
            status: 'New',
            wedding_date: new Date('2026-06-15'),
            notes: 'Notes',
            lead_source: 'REFERRAL',
            lead_source_details: null,
            selected_package_id: 5,
            source_package_id: null,
            contact_id: 10,
            package_contents_snapshot: null,
            preferred_payment_schedule_template_id: null,
            event_category: 'Corporate',
            welcome_sent_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            contact: {
                id: 10,
                first_name: 'Chris',
                last_name: 'Taylor',
                email: 'chris@example.com',
                phone_number: null,
                company_name: 'Acme',
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
            ...overrides,
        });

        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });

        it('computes blueprint_drift when consumed version matches latest', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(
                baseDetailInquiry({
                    package_contents_snapshot: {
                        source_day_blueprint_id: 10,
                        source_day_blueprint_version_id: 20,
                        source_day_blueprint_version_number: 2,
                    },
                }),
            );
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 20 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 2 });

            const result = await service.findOne(1, 1);

            expect(result.blueprint_drift).toEqual({
                blueprint_id: 10,
                consumed_version_id: 20,
                consumed_version_number: 2,
                latest_version_id: 20,
                latest_version_number: 2,
                is_current: true,
            });
            expect(result.event_type).toBe('Corporate');
        });

        it('builds full venue address from location fields', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(
                baseDetailInquiry({
                    schedule_location_slots: [
                        {
                            name: 'Ceremony',
                            address: null,
                            location: {
                                name: 'Grand Hall',
                                address_line1: '1 Main St',
                                address_line2: 'Suite 2',
                                city: 'London',
                                state: null,
                                country: 'UK',
                                postal_code: 'SW1A 1AA',
                                lat: 51.5,
                                lng: -0.1,
                            },
                        },
                    ],
                }),
            );

            const result = await service.findOne(1, 1);

            expect(result.venue_details).toBe('Grand Hall');
            expect(result.venue_address).toBe('1 Main St, Suite 2, London, UK, SW1A 1AA');
            expect(result.venue_lat).toBe(51.5);
        });

        it('falls back to assigned producer task when no crew slot exists', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(
                baseDetailInquiry({
                    schedule_day_crew_slots: [],
                    inquiry_tasks: [
                        {
                            id: 50,
                            assigned_to: {
                                id: 7,
                                contact: { first_name: 'Pat', last_name: 'Jones', email: 'pat@example.com' },
                            },
                            job_role: { id: 3, name: 'producer', display_name: 'Lead Producer' },
                        },
                    ],
                }),
            );

            const result = await service.findOne(1, 1);

            expect(result.lead_producer).toEqual({
                id: 7,
                name: 'Pat Jones',
                email: 'pat@example.com',
                label: null,
                job_role_name: 'Lead Producer',
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('throws when inquiry does not belong to brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(1, 99)).rejects.toThrow(NotFoundException);
        });

        it('returns upcoming discovery call when one exists', async () => {
            const upcoming = {
                id: 5,
                title: 'Discovery',
                start_time: new Date('2026-08-01T10:00:00Z'),
                end_time: new Date('2026-08-01T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
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
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });

        it('falls back to most recent past discovery call when none are upcoming', async () => {
            const pastCall = {
                id: 3,
                title: 'Past discovery',
                start_time: new Date('2025-01-01T10:00:00Z'),
                end_time: new Date('2025-01-01T10:30:00Z'),
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
});
