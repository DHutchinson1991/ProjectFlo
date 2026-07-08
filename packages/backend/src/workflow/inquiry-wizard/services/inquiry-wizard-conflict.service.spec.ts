import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardConflictService } from './inquiry-wizard-conflict.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';

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

        it('separates booked inquiries and projects from soft inquiry conflicts', async () => {
            const weddingDate = new Date('2026-09-12T14:00:00.000Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 11,
                    status: 'Booked',
                    contact: { first_name: 'Alice', last_name: 'Booked' },
                },
                {
                    id: 12,
                    status: 'New',
                    contact: { first_name: 'Bob', last_name: 'Lead' },
                },
            ]);
            prisma.projects.findMany.mockResolvedValue([
                { id: 99, project_name: 'Confirmed Wedding' },
            ]);

            const result = await service.checkDateConflicts(1, 5);

            expect(result.wedding_date).toEqual(weddingDate);
            expect(result.booked_conflicts).toEqual([
                { type: 'inquiry', id: 11, name: 'Alice Booked', status: 'Booked' },
                { type: 'project', id: 99, name: 'Confirmed Wedding', status: 'Confirmed' },
            ]);
            expect(result.soft_conflicts).toEqual([
                { type: 'inquiry', id: 12, name: 'Bob Lead', status: 'New' },
            ]);

            expect(prisma.inquiries.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: { not: 10 },
                    }),
                }),
            );
        });
    });

    describe('checkCrewConflicts', () => {
        it('returns no conflicts when submission has no wedding date', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: null },
            });

            const result = await service.checkCrewConflicts(1, 5);

            expect(result).toEqual({ conflicts: [] });
            expect(prisma.calendar_events.findMany).not.toHaveBeenCalled();
        });

        it('returns on-set crew conflicts and deduplicates by crew id', async () => {
            const weddingDate = new Date('2026-09-12T12:00:00.000Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                id: 1,
                inquiry: { id: 10, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 7,
                    event_type: 'WEDDING_DAY',
                    title: 'Smith Wedding',
                    crew: {
                        contact: { first_name: 'Jane', last_name: 'Doe' },
                        job_role_assignments: [
                            { job_role: { name: 'videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 7,
                    event_type: 'PROJECT_ASSIGNMENT',
                    title: 'Duplicate slot',
                    crew: {
                        contact: { first_name: 'Jane', last_name: 'Doe' },
                        job_role_assignments: [
                            { job_role: { name: 'videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 8,
                    event_type: 'WEDDING_DAY',
                    title: 'Producer only',
                    crew: {
                        contact: { first_name: 'Pat', last_name: 'Producer' },
                        job_role_assignments: [
                            { job_role: { name: 'producer', display_name: 'Producer' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(1, 5);

            expect(result.conflicts).toEqual([
                {
                    crew_id: 7,
                    name: 'Jane Doe',
                    role: 'Lead Videographer',
                    event_type: 'WEDDING_DAY',
                    event_title: 'Smith Wedding',
                },
            ]);
        });
    });
});
