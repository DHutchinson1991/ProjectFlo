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
    lead_source: 'WEB',
    lead_source_details: null,
    selected_package_id: null,
    event_category: 'Wedding',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-02'),
    contact_id: 5,
    package_contents_snapshot: null,
    contact: { first_name: 'Alex', last_name: 'Taylor', email: 'alex@example.com', phone_number: null },
    selected_package: null,
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

    describe('findAll blueprint drift batching', () => {
        it('returns null drift when snapshots lack blueprint lineage', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({ package_contents_snapshot: { name: 'Gold' } }),
            ]);

            const results = await service.findAll(1);

            expect(results).toHaveLength(1);
            expect(results[0].blueprint_drift).toBeNull();
            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
        });

        it('computes drift for multiple inquiries with a single batched lookup', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow({
                    id: 1,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 10,
                        source_day_blueprint_version_id: 100,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                baseInquiryListRow({
                    id: 2,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 10,
                        source_day_blueprint_version_id: 101,
                        source_day_blueprint_version_number: 3,
                    },
                }),
                baseInquiryListRow({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 10, latest_published_version_id: 101 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 101, version_number: 3 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
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
    });

    describe('findOne', () => {
        const detailInquiry = (overrides: Record<string, unknown> = {}) => ({
            id: 7,
            status: 'New',
            wedding_date: new Date('2026-09-01'),
            notes: null,
            lead_source: 'WEB',
            lead_source_details: null,
            selected_package_id: null,
            source_package_id: null,
            contact_id: 5,
            package_contents_snapshot: null,
            preferred_payment_schedule_template_id: null,
            event_category: 'Birthday',
            welcome_sent_at: null,
            created_at: new Date('2026-01-01'),
            updated_at: new Date('2026-01-02'),
            contact: {
                id: 5,
                first_name: 'Jamie',
                last_name: 'Lee',
                email: 'jamie@example.com',
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
            ...overrides,
        });

        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });

        it('maps event category and computes current blueprint drift', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(detailInquiry({
                package_contents_snapshot: {
                    source_day_blueprint_id: 20,
                    source_day_blueprint_version_id: 200,
                    source_day_blueprint_version_number: 1,
                },
            }));
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 200 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 1 });

            const result = await service.findOne(7, 1);

            expect(result.event_type).toBe('Birthday');
            expect(result.blueprint_drift).toEqual({
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
        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(1, 9)).rejects.toThrow(NotFoundException);
        });

        it('prefers the next upcoming discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            const upcoming = {
                id: 50,
                title: 'Discovery',
                start_time: new Date('2026-08-01T10:00:00Z'),
                end_time: new Date('2026-08-01T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(1, 9);

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

        it('falls back to the most recent past discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 40,
                    title: 'Past discovery',
                    start_time: new Date('2026-01-01T10:00:00Z'),
                    end_time: new Date('2026-01-01T10:30:00Z'),
                    meeting_type: 'phone',
                    meeting_url: null,
                    location: null,
                    is_confirmed: false,
                });

            const result = await service.getDiscoveryCall(1, 9);

            expect(result?.title).toBe('Past discovery');
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });
    });
});
