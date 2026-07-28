import { NotFoundException } from '@nestjs/common';
import { InquiryQueryService } from './inquiry-query.service';

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

const baseInquiryRow = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: 'New',
    wedding_date: new Date('2026-08-01'),
    notes: null,
    lead_source: 'WEB',
    lead_source_details: null,
    selected_package_id: null,
    contact_id: 10,
    package_contents_snapshot: null,
    event_category: 'Wedding',
    created_at: new Date('2026-07-01'),
    updated_at: new Date('2026-07-01'),
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

    beforeEach(() => {
        prisma = buildPrisma();
        service = new InquiryQueryService(prisma as never);
    });

    describe('findAll blueprint drift batching', () => {
        it('computes drift for multiple inquiries with a single blueprint/version query pair', async () => {
            const snapshotA = {
                source_day_blueprint_id: 5,
                source_day_blueprint_version_id: 50,
                source_day_blueprint_version_number: 2,
            };
            const snapshotB = {
                source_day_blueprint_id: 5,
                source_day_blueprint_version_id: 51,
                source_day_blueprint_version_number: 3,
            };

            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryRow({ id: 1, package_contents_snapshot: snapshotA }),
                baseInquiryRow({ id: 2, package_contents_snapshot: snapshotB }),
                baseInquiryRow({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 5, latest_published_version_id: 52 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 52, version_number: 4 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 5,
                consumed_version_id: 50,
                consumed_version_number: 2,
                latest_version_id: 52,
                latest_version_number: 4,
                is_current: false,
            });
            expect(results[1].blueprint_drift).toEqual({
                blueprint_id: 5,
                consumed_version_id: 51,
                consumed_version_number: 3,
                latest_version_id: 52,
                latest_version_number: 4,
                is_current: false,
            });
            expect(results[2].blueprint_drift).toBeNull();
        });

        it('skips blueprint queries when no snapshots reference a blueprint', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseInquiryRow({ package_contents_snapshot: { foo: 'bar' } }),
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).not.toHaveBeenCalled();
            expect(prisma.dayBlueprintVersion.findMany).not.toHaveBeenCalled();
            expect(results[0].blueprint_drift).toBeNull();
        });
    });

    describe('findOne', () => {
        it('returns blueprint drift when snapshot references a current version', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({
                id: 7,
                status: 'New',
                wedding_date: new Date('2026-09-01'),
                notes: null,
                lead_source: null,
                lead_source_details: null,
                selected_package_id: null,
                source_package_id: null,
                contact_id: 3,
                package_contents_snapshot: {
                    source_day_blueprint_id: 9,
                    source_day_blueprint_version_id: 90,
                    source_day_blueprint_version_number: 1,
                },
                preferred_payment_schedule_template_id: null,
                event_category: 'Birthday',
                welcome_sent_at: null,
                created_at: new Date(),
                updated_at: new Date(),
                contact: {
                    id: 3,
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
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 90 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 1 });

            const result = await service.findOne(7, 1);

            expect(result.blueprint_drift).toEqual({
                blueprint_id: 9,
                consumed_version_id: 90,
                consumed_version_number: 1,
                latest_version_id: 90,
                latest_version_number: 1,
                is_current: true,
            });
            expect(result.event_type).toBe('Birthday');
        });

        it('throws when inquiry is missing', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.findOne(99, 1)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('getDiscoveryCall', () => {
        it('prefers the next upcoming discovery call', async () => {
            const upcoming = {
                id: 100,
                title: 'Discovery',
                start_time: new Date('2026-08-01T10:00:00Z'),
                end_time: new Date('2026-08-01T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com/abc',
                location: null,
                is_confirmed: true,
            };

            prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(5, 1);

            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 5,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
            expect(result).toBe(upcoming);
        });

        it('falls back to the most recent past discovery call when none are upcoming', async () => {
            const pastCall = {
                id: 101,
                title: 'Past discovery',
                start_time: new Date('2026-06-01T10:00:00Z'),
                end_time: new Date('2026-06-01T10:30:00Z'),
                meeting_type: 'phone',
                meeting_url: null,
                location: null,
                is_confirmed: true,
            };

            prisma.inquiries.findFirst.mockResolvedValue({ id: 5 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(pastCall);

            const result = await service.getDiscoveryCall(5, 1);

            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
            expect(result).toBe(pastCall);
        });

        it('throws when inquiry does not belong to the brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);
            await expect(service.getDiscoveryCall(5, 1)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
