import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryWizardConflictService } from './inquiry-wizard-conflict.service';

const buildPrisma = () => ({
    inquiry_wizard_submissions: {
        findFirst: jest.fn(),
    },
    inquiries: {
        findMany: jest.fn(),
    },
    projects: {
        findMany: jest.fn(),
    },
    calendar_events: {
        findMany: jest.fn(),
    },
});

describe('InquiryWizardConflictService', () => {
    let service: InquiryWizardConflictService;
    let prisma: ReturnType<typeof buildPrisma>;

    const weddingDate = new Date('2026-09-15T14:00:00Z');

    beforeEach(async () => {
        prisma = buildPrisma();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InquiryWizardConflictService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get(InquiryWizardConflictService);
    });

    describe('checkDateConflicts', () => {
        it('returns empty conflicts when submission has no wedding date', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: null },
            });

            const result = await service.checkDateConflicts(1, 5);

            expect(result).toEqual({
                wedding_date: null,
                booked_conflicts: [],
                soft_conflicts: [],
            });
            expect(prisma.inquiries.findMany).not.toHaveBeenCalled();
        });

        it('separates booked inquiries from soft conflicts and includes projects', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 20,
                    status: 'Booked',
                    contact: { first_name: 'Alice', last_name: 'Brown' },
                },
                {
                    id: 21,
                    status: 'New',
                    contact: { first_name: 'Bob', last_name: 'Green' },
                },
            ]);
            prisma.projects.findMany.mockResolvedValue([
                { id: 30, project_name: 'Smith Wedding' },
            ]);

            const result = await service.checkDateConflicts(1, 5);

            expect(result.wedding_date).toEqual(weddingDate);
            expect(result.booked_conflicts).toEqual([
                { type: 'inquiry', id: 20, name: 'Alice Brown', status: 'Booked' },
                { type: 'project', id: 30, name: 'Smith Wedding', status: 'Confirmed' },
            ]);
            expect(result.soft_conflicts).toEqual([
                { type: 'inquiry', id: 21, name: 'Bob Green', status: 'New' },
            ]);
        });

        it('queries same-day window for conflicting inquiries and projects', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([]);
            prisma.projects.findMany.mockResolvedValue([]);

            await service.checkDateConflicts(1, 5);

            const dayStart = new Date(weddingDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(weddingDate);
            dayEnd.setHours(23, 59, 59, 999);

            expect(prisma.inquiries.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: { not: 10 },
                        wedding_date: { gte: dayStart, lte: dayEnd },
                    }),
                }),
            );
            expect(prisma.projects.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        brand_id: 5,
                        archived_at: null,
                        wedding_date: { gte: dayStart, lte: dayEnd },
                    }),
                }),
            );
        });
    });

    describe('checkCrewConflicts', () => {
        it('returns empty when submission has no wedding date', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: null },
            });

            const result = await service.checkCrewConflicts(1, 5);

            expect(result).toEqual({ conflicts: [] });
        });

        it('returns on-set crew with videographer/operator roles only once per crew member', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 100,
                    event_type: 'WEDDING_DAY',
                    title: 'Jones Wedding',
                    crew: {
                        contact: { first_name: 'Tom', last_name: 'Lee' },
                        job_role_assignments: [
                            { job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' } },
                            { job_role: { name: 'editor', display_name: 'Editor' } },
                        ],
                    },
                },
                {
                    crew_id: 100,
                    event_type: 'PROJECT_ASSIGNMENT',
                    title: 'Duplicate event',
                    crew: {
                        contact: { first_name: 'Tom', last_name: 'Lee' },
                        job_role_assignments: [
                            { job_role: { name: 'videographer', display_name: 'Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 200,
                    event_type: 'WEDDING_DAY',
                    title: 'Admin day',
                    crew: {
                        contact: { first_name: 'Admin', last_name: 'User' },
                        job_role_assignments: [
                            { job_role: { name: 'coordinator', display_name: 'Coordinator' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(1, 5);

            expect(result.conflicts).toHaveLength(1);
            expect(result.conflicts[0]).toEqual({
                crew_id: 100,
                name: 'Tom Lee',
                role: 'Lead Videographer',
                event_type: 'WEDDING_DAY',
                event_title: 'Jones Wedding',
            });
        });
    });
});
