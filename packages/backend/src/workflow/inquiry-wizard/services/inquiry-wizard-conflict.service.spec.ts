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
                inquiry: { id: 1, wedding_date: null },
            });

            const result = await service.checkDateConflicts(10, 1);

            expect(result).toEqual({
                wedding_date: null,
                booked_conflicts: [],
                soft_conflicts: [],
            });
            expect(prisma.inquiries.findMany).not.toHaveBeenCalled();
        });

        it('separates booked inquiries and projects from soft inquiry conflicts', async () => {
            const weddingDate = new Date('2026-08-01T12:00:00.000Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 2,
                    status: 'Booked',
                    contact: { first_name: 'Alex', last_name: 'Booked' },
                },
                {
                    id: 3,
                    status: 'New',
                    contact: { first_name: 'Sam', last_name: 'Soft' },
                },
            ]);
            prisma.projects.findMany.mockResolvedValue([
                { id: 9, project_name: 'Confirmed Wedding' },
            ]);

            const result = await service.checkDateConflicts(10, 1);

            expect(result.wedding_date).toEqual(weddingDate);
            expect(result.booked_conflicts).toEqual([
                { type: 'inquiry', id: 2, name: 'Alex Booked', status: 'Booked' },
                { type: 'project', id: 9, name: 'Confirmed Wedding', status: 'Confirmed' },
            ]);
            expect(result.soft_conflicts).toEqual([
                { type: 'inquiry', id: 3, name: 'Sam Soft', status: 'New' },
            ]);
        });

        it('excludes the current inquiry from conflict search', async () => {
            const weddingDate = new Date('2026-08-01T12:00:00.000Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 42, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([]);
            prisma.projects.findMany.mockResolvedValue([]);

            await service.checkDateConflicts(10, 1);

            expect(prisma.inquiries.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: { not: 42 },
                    }),
                }),
            );
        });
    });

    describe('checkCrewConflicts', () => {
        it('returns empty conflicts when submission has no wedding date', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: null },
            });

            const result = await service.checkCrewConflicts(10, 1);

            expect(result).toEqual({ conflicts: [] });
            expect(prisma.calendar_events.findMany).not.toHaveBeenCalled();
        });

        it('flags on-set crew with matching role keywords once per crew member', async () => {
            const weddingDate = new Date('2026-08-01T12:00:00.000Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 7,
                    event_type: 'WEDDING_DAY',
                    title: 'Smith Wedding',
                    crew: {
                        contact: { first_name: 'Jamie', last_name: 'Cam' },
                        job_role_assignments: [
                            { job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 7,
                    event_type: 'PROJECT_ASSIGNMENT',
                    title: 'Duplicate event for same crew',
                    crew: {
                        contact: { first_name: 'Jamie', last_name: 'Cam' },
                        job_role_assignments: [
                            { job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 8,
                    event_type: 'WEDDING_DAY',
                    title: 'Producer day',
                    crew: {
                        contact: { first_name: 'Pat', last_name: 'Producer' },
                        job_role_assignments: [
                            { job_role: { name: 'producer', display_name: 'Producer' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(10, 1);

            expect(result.conflicts).toEqual([
                {
                    crew_id: 7,
                    name: 'Jamie Cam',
                    role: 'Lead Videographer',
                    event_type: 'WEDDING_DAY',
                    event_title: 'Smith Wedding',
                },
            ]);
        });

        it('ignores crew without on-set role keywords', async () => {
            const weddingDate = new Date('2026-08-01T12:00:00.000Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 11,
                    event_type: 'WEDDING_DAY',
                    title: 'Admin block',
                    crew: {
                        contact: { first_name: 'Taylor', last_name: 'Admin' },
                        job_role_assignments: [
                            { job_role: { name: 'office_manager', display_name: 'Office Manager' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(10, 1);

            expect(result.conflicts).toEqual([]);
        });
    });
});
