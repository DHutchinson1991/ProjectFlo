import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
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

const snapshot = (blueprintId: number, versionId: number, versionNumber = 1) => ({
    source_day_blueprint_id: blueprintId,
    source_day_blueprint_version_id: versionId,
    source_day_blueprint_version_number: versionNumber,
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
        it('computes drift in batch without N+1 queries per inquiry', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 1,
                    status: 'New',
                    wedding_date: new Date('2026-08-01'),
                    notes: null,
                    lead_source: 'WEB',
                    lead_source_details: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                    contact_id: 1,
                    selected_package_id: null,
                    event_category: 'Wedding',
                    package_contents_snapshot: snapshot(10, 20, 1),
                    contact: { first_name: 'Alex', last_name: 'Lee', email: 'a@example.com', phone_number: null },
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
                    wedding_date: new Date('2026-09-01'),
                    notes: null,
                    lead_source: 'WEB',
                    lead_source_details: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                    contact_id: 2,
                    selected_package_id: null,
                    event_category: 'Wedding',
                    package_contents_snapshot: snapshot(10, 30, 2),
                    contact: { first_name: 'Sam', last_name: 'Kim', email: 's@example.com', phone_number: null },
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
                    id: 3,
                    status: 'New',
                    wedding_date: new Date('2026-10-01'),
                    notes: null,
                    lead_source: 'WEB',
                    lead_source_details: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                    contact_id: 3,
                    selected_package_id: null,
                    event_category: 'Wedding',
                    package_contents_snapshot: null,
                    contact: { first_name: 'Jo', last_name: 'Pat', email: 'j@example.com', phone_number: null },
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
                { id: 10, latest_published_version_id: 30 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 30, version_number: 2 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprint.findUnique).not.toHaveBeenCalled();

            expect(results[0].blueprint_drift).toEqual({
                blueprint_id: 10,
                consumed_version_id: 20,
                consumed_version_number: 1,
                latest_version_id: 30,
                latest_version_number: 2,
                is_current: false,
            });
            expect(results[1].blueprint_drift).toEqual({
                blueprint_id: 10,
                consumed_version_id: 30,
                consumed_version_number: 2,
                latest_version_id: 30,
                latest_version_number: 2,
                is_current: true,
            });
            expect(results[2].blueprint_drift).toBeNull();
        });
    });

    describe('findOne blueprint drift', () => {
        const baseInquiry = () => ({
            id: 5,
            status: 'New',
            wedding_date: new Date('2026-08-01'),
            notes: null,
            lead_source: 'WEB',
            lead_source_details: null,
            selected_package_id: null,
            source_package_id: null,
            package_contents_snapshot: snapshot(11, 22, 1),
            preferred_payment_schedule_template_id: null,
            event_category: 'Corporate',
            welcome_sent_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            contact_id: 9,
            contact: {
                id: 9,
                first_name: 'Riley',
                last_name: 'Ng',
                email: 'r@example.com',
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

        it('includes blueprint drift on detail responses', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(baseInquiry());
            prisma.dayBlueprint.findUnique.mockResolvedValue({ latest_published_version_id: 22 });
            prisma.dayBlueprintVersion.findUnique.mockResolvedValue({ version_number: 1 });

            const result = await service.findOne(5, 1);

            expect(result.blueprint_drift).toEqual({
                blueprint_id: 11,
                consumed_version_id: 22,
                consumed_version_number: 1,
                latest_version_id: 22,
                latest_version_number: 1,
                is_current: true,
            });
            expect(result.event_type).toBe('Corporate');
        });

        it('throws NotFoundException when inquiry does not exist', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getDiscoveryCall', () => {
        it('prefers the next upcoming discovery call over past events', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 7 });
            const upcoming = {
                id: 100,
                title: 'Upcoming call',
                start_time: new Date('2026-08-01T10:00:00Z'),
                end_time: new Date('2026-08-01T10:30:00Z'),
                meeting_type: 'video',
                meeting_url: 'https://meet.example.com/abc',
                location: null,
                is_confirmed: true,
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(7, 1);

            expect(result).toBe(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        inquiry_id: 7,
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(1);
        });

        it('falls back to the most recent past discovery call when none are upcoming', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 8 });
            prisma.calendar_events.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 101,
                    title: 'Past call',
                    start_time: new Date('2026-01-01T10:00:00Z'),
                    end_time: new Date('2026-01-01T10:30:00Z'),
                    meeting_type: 'phone',
                    meeting_url: null,
                    location: 'Office',
                    is_confirmed: true,
                });

            const result = await service.getDiscoveryCall(8, 1);

            expect(result?.title).toBe('Past call');
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledTimes(2);
        });

        it('throws when inquiry is not found for the brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.getDiscoveryCall(404, 1)).rejects.toThrow('Inquiry 404 not found');
        });
    });
});
