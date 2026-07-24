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

const snapshot = (overrides: Record<string, unknown> = {}) => ({
    source_day_blueprint_id: 5,
    source_day_blueprint_version_id: 20,
    source_day_blueprint_version_number: 2,
    ...overrides,
});

const baseInquiryListRow = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: 'New',
    wedding_date: new Date('2026-08-01'),
    notes: null,
    lead_source: 'WEB',
    lead_source_details: null,
    created_at: new Date('2026-07-01'),
    updated_at: new Date('2026-07-01'),
    contact_id: 10,
    selected_package_id: null,
    event_category: 'Wedding',
    package_contents_snapshot: snapshot(),
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

    describe('findAll blueprint drift', () => {
        it('batch-computes drift and marks current snapshots', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryListRow(),
                baseInquiryListRow({
                    id: 2,
                    package_contents_snapshot: snapshot({
                        source_day_blueprint_version_id: 99,
                        source_day_blueprint_version_number: 9,
                    }),
                }),
                baseInquiryListRow({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 5, latest_published_version_id: 20 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 20, version_number: 2 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 5,
                consumed_version_id: 20,
                consumed_version_number: 2,
                latest_version_id: 20,
                latest_version_number: 2,
                is_current: true,
            });
            expect(results[1].blueprint_drift?.is_current).toBe(false);
            expect(results[2].blueprint_drift).toBeNull();
        });
    });

    describe('findOne blueprint drift', () => {
        const baseDetailInquiry = (overrides: Record<string, unknown> = {}) => ({
            id: 7,
            status: 'New',
            wedding_date: new Date('2026-08-01'),
            notes: null,
            lead_source: 'WEB',
            lead_source_details: null,
            selected_package_id: null,
            source_package_id: null,
            contact_id: 10,
            package_contents_snapshot: snapshot(),
            preferred_payment_schedule_template_id: null,
            event_category: 'Birthday',
            welcome_sent_at: null,
            created_at: new Date('2026-07-01'),
            updated_at: new Date('2026-07-01'),
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
            ...overrides,
        });

        it('returns null drift when snapshot lacks blueprint ids', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(
                baseDetailInquiry({ package_contents_snapshot: { name: 'pkg' } }),
            );

            const result = await service.findOne(7, 1);

            expect(result.blueprint_drift).toBeNull();
            expect(prisma.dayBlueprint.findUnique).not.toHaveBeenCalled();
        });

        it('reports drift when a newer blueprint version is published', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(baseDetailInquiry());
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 30 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 3 });

            const result = await service.findOne(7, 1);

            expect(result.blueprint_drift).toEqual({
                blueprint_id: 5,
                consumed_version_id: 20,
                consumed_version_number: 2,
                latest_version_id: 30,
                latest_version_number: 3,
                is_current: false,
            });
            expect(result.event_type).toBe('Birthday');
        });

        it('throws NotFoundException when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getDiscoveryCall', () => {
        it('prefers the next upcoming discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 4 });
            const upcoming = {
                id: 100,
                title: 'Discovery',
                start_time: new Date('2026-08-02T10:00:00Z'),
                end_time: new Date('2026-08-02T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(4, 1);

            expect(result).toEqual(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 4,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });

        it('falls back to the most recent past discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 4 });
            const pastCall = {
                id: 101,
                title: 'Past discovery',
                start_time: new Date('2026-07-01T10:00:00Z'),
                end_time: new Date('2026-07-01T10:30:00Z'),
                meeting_type: 'phone',
                meeting_url: null,
                location: null,
                is_confirmed: false,
            };
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(pastCall);

            const result = await service.getDiscoveryCall(4, 1);

            expect(result).toEqual(pastCall);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });

        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(4, 1)).rejects.toThrow(NotFoundException);
        });
    });
});
