import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardConflictService } from './inquiry-wizard-conflict.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const weddingDate = new Date('2026-08-15T14:00:00.000Z');

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

            const result = await service.checkDateConflicts(1, 10);

            expect(result).toEqual({
                wedding_date: null,
                booked_conflicts: [],
                soft_conflicts: [],
            });
            expect(prisma.inquiries.findMany).not.toHaveBeenCalled();
        });

        it('separates booked inquiries from soft conflicts and includes projects', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 5, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 10,
                    status: 'Booked',
                    contact: { first_name: 'Amy', last_name: 'Lee' },
                },
                {
                    id: 11,
                    status: 'New',
                    contact: { first_name: 'Ben', last_name: 'Carter' },
                },
            ]);
            prisma.projects.findMany.mockResolvedValue([
                { id: 20, project_name: 'Carter Wedding' },
            ]);

            const result = await service.checkDateConflicts(1, 10);

            expect(result.wedding_date).toEqual(weddingDate);
            expect(result.booked_conflicts).toEqual([
                { type: 'inquiry', id: 10, name: 'Amy Lee', status: 'Booked' },
                { type: 'project', id: 20, name: 'Carter Wedding', status: 'Confirmed' },
            ]);
            expect(result.soft_conflicts).toEqual([
                { type: 'inquiry', id: 11, name: 'Ben Carter', status: 'New' },
            ]);
        });
    });

    describe('checkCrewConflicts', () => {
        it('returns empty conflicts when submission has no wedding date', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: null },
            });

            const result = await service.checkCrewConflicts(1, 10);

            expect(result).toEqual({ conflicts: [] });
            expect(prisma.calendar_events.findMany).not.toHaveBeenCalled();
        });

        it('reports on-set crew only once per crew member', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 5, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 100,
                    event_type: 'WEDDING_DAY',
                    title: 'Smith Wedding',
                    crew: {
                        contact: { first_name: 'Jamie', last_name: 'Fox' },
                        job_role_assignments: [
                            { job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 100,
                    event_type: 'PROJECT_ASSIGNMENT',
                    title: 'Duplicate event',
                    crew: {
                        contact: { first_name: 'Jamie', last_name: 'Fox' },
                        job_role_assignments: [
                            { job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 101,
                    event_type: 'WEDDING_DAY',
                    title: 'Producer day',
                    crew: {
                        contact: { first_name: 'Sam', last_name: 'Reed' },
                        job_role_assignments: [
                            { job_role: { name: 'producer', display_name: 'Producer' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(1, 10);

            expect(result.conflicts).toEqual([
                {
                    crew_id: 100,
                    name: 'Jamie Fox',
                    role: 'Lead Videographer',
                    event_type: 'WEDDING_DAY',
                    event_title: 'Smith Wedding',
                },
            ]);
        });

        it('ignores crew without on-set role keywords', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 5, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 200,
                    event_type: 'WEDDING_DAY',
                    title: 'Editor only',
                    crew: {
                        contact: { first_name: 'Pat', last_name: 'Ng' },
                        job_role_assignments: [
                            { job_role: { name: 'editor', display_name: 'Editor' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(1, 10);

            expect(result.conflicts).toEqual([]);
        });
    });
});
