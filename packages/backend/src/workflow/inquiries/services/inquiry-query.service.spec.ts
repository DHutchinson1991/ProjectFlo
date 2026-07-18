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
    created_at: new Date(),
    updated_at: new Date(),
    contact_id: 5,
    selected_package_id: null,
    event_category: 'Wedding',
    package_contents_snapshot: null,
    contact: { first_name: 'Alex', last_name: 'Lee', email: 'alex@example.com', phone_number: null },
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
        it('batch-computes drift for inquiries with blueprint snapshots', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    id: 1,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 100,
                        source_day_blueprint_version_id: 200,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                baseListInquiry({
                    id: 2,
                    package_contents_snapshot: null,
                }),
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
            expect(results[1].blueprint_drift).toBeNull();
        });
    });

    describe('findOne', () => {
        it('throws when inquiry is not found', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
        });

        it('includes blueprint drift on detail response', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 7,
                status: 'New',
                wedding_date: new Date('2026-08-01'),
                notes: null,
                lead_source: 'WEB',
                lead_source_details: null,
                selected_package_id: null,
                source_package_id: null,
                contact_id: 5,
                package_contents_snapshot: {
                    source_day_blueprint_id: 10,
                    source_day_blueprint_version_id: 20,
                    source_day_blueprint_version_number: 1,
                },
                preferred_payment_schedule_template_id: null,
                event_category: 'Wedding',
                welcome_sent_at: null,
                created_at: new Date(),
                updated_at: new Date(),
                contact: {
                    id: 5,
                    first_name: 'Sam',
                    last_name: 'Taylor',
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
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 20 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 1 });

            const detail = await service.findOne(7, 1);

            expect(detail.blueprint_drift).toEqual({
                blueprint_id: 10,
                consumed_version_id: 20,
                consumed_version_number: 1,
                latest_version_id: 20,
                latest_version_number: 1,
                is_current: true,
            });
        });
    });

    describe('getDiscoveryCall', () => {
        it('prefers the next upcoming discovery call', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 3 });
            const upcoming = {
                id: 50,
                title: 'Discovery',
                start_time: new Date('2026-08-10T10:00:00Z'),
                end_time: new Date('2026-08-10T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(3, 1);

            expect(result).toBe(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 3,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });

        it('falls back to most recent past discovery call when none are upcoming', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 3 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 51, title: 'Past call' });

            const result = await service.getDiscoveryCall(3, 1);

            expect(result).toEqual({ id: 51, title: 'Past call' });
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });
    });
});
