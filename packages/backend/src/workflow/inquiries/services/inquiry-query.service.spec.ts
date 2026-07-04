import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryQueryService } from './inquiry-query.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const buildPrisma = () => ({
    inquiries: { findMany: jest.fn(), findFirst: jest.fn() },
    dayBlueprint: { findUnique: jest.fn(), findMany: jest.fn() },
    dayBlueprintVersion: { findUnique: jest.fn(), findMany: jest.fn() },
    calendar_events: { findFirst: jest.fn() },
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

    const baseListInquiry = (overrides: Record<string, unknown> = {}) => ({
        id: 1,
        status: 'New',
        wedding_date: new Date('2026-07-01'),
        notes: null,
        lead_source: null,
        lead_source_details: null,
        created_at: new Date(),
        updated_at: new Date(),
        contact_id: 10,
        selected_package_id: null,
        event_category: 'Wedding',
        package_contents_snapshot: null,
        contact: { first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: null },
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

    describe('findAll', () => {
        it('computes blueprint drift in batch without N+1 queries', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    package_contents_snapshot: {
                        source_day_blueprint_id: 1,
                        source_day_blueprint_version_id: 10,
                        source_day_blueprint_version_number: 2,
                    },
                }),
                baseListInquiry({
                    id: 2,
                    package_contents_snapshot: {
                        source_day_blueprint_id: 1,
                        source_day_blueprint_version_id: 11,
                        source_day_blueprint_version_number: 3,
                    },
                }),
                baseListInquiry({ id: 3, package_contents_snapshot: null }),
            ]);
            prisma.dayBlueprint.findMany.mockResolvedValue([
                { id: 1, latest_published_version_id: 11 },
            ]);
            prisma.dayBlueprintVersion.findMany.mockResolvedValue([
                { id: 11, version_number: 3 },
            ]);

            const results = await service.findAll(1);

            expect(prisma.dayBlueprint.findMany).toHaveBeenCalledTimes(1);
            expect(prisma.dayBlueprintVersion.findMany).toHaveBeenCalledTimes(1);
            expect(results[0].blueprint_drift).toMatchObject({
                blueprint_id: 1,
                consumed_version_id: 10,
                is_current: false,
            });
            expect(results[1].blueprint_drift?.is_current).toBe(true);
            expect(results[2].blueprint_drift).toBeNull();
        });

        it('derives pipeline stage from inquiry tasks when present', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    inquiry_tasks: [
                        {
                            name: 'Qualify',
                            order_index: 0,
                            children: [{ status: 'Completed' }, { status: 'In Progress' }],
                        },
                        {
                            name: 'Proposal',
                            order_index: 1,
                            children: [{ status: 'Pending' }],
                        },
                    ],
                }),
            ]);

            const [result] = await service.findAll(1);

            expect(result.pipeline_stage).toBe('Qualify');
        });

        it('falls back to financial document status when no tasks exist', async () => {
            prisma.inquiries.findMany.mockResolvedValue([
                baseListInquiry({
                    proposals: [{ status: 'Sent' }],
                }),
            ]);

            const [result] = await service.findAll(1);

            expect(result.pipeline_stage).toBe('Proposal Sent');
        });
    });

    describe('getDiscoveryCall', () => {
        it('throws when inquiry is not found for brand', async () => {
            prisma.inquiries.findFirst.mockResolvedValue(null);

            await expect(service.getDiscoveryCall(1, 99)).rejects.toThrow(NotFoundException);
        });

        it('prefers upcoming discovery call over past events', async () => {
            prisma.inquiries.findFirst.mockResolvedValue({ id: 1 });
            const upcoming = {
                id: 50,
                title: 'Upcoming',
                start_time: new Date('2099-01-01'),
                end_time: new Date('2099-01-01'),
            };
            prisma.calendar_events.findFirst.mockResolvedValue(upcoming);

            const result = await service.getDiscoveryCall(1, 1);

            expect(result).toBe(upcoming);
            expect(prisma.calendar_events.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        event_type: 'DISCOVERY_CALL',
                        start_time: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                }),
            );
        });
    });
});
