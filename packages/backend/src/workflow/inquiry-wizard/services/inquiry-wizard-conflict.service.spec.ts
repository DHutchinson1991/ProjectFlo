import { Test, TestingModule } from '@nestjs/testing';
import { InquiryWizardConflictService } from './inquiry-wizard-conflict.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const weddingDate = new Date('2026-09-12T15:00:00Z');

const buildPrisma = () => ({
    inquiry_wizard_submissions: { findFirst: jest.fn() },
    inquiries: { findMany: jest.fn() },
    projects: { findMany: jest.fn() },
    calendar_events: { findMany: jest.fn() },
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

            expect(result).toEqual({ wedding_date: null, booked_conflicts: [], soft_conflicts: [] });
            expect(prisma.inquiries.findMany).not.toHaveBeenCalled();
        });

        it('separates booked inquiries from soft conflicts and includes projects', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 2,
                    status: 'Booked',
                    contact: { first_name: 'Alice', last_name: 'Smith' },
                },
                {
                    id: 3,
                    status: 'New',
                    contact: { first_name: 'Bob', last_name: 'Jones' },
                },
            ]);
            prisma.projects.findMany.mockResolvedValue([
                { id: 99, project_name: 'Confirmed Wedding' },
            ]);

            const result = await service.checkDateConflicts(10, 1);

            expect(result.wedding_date).toEqual(weddingDate);
            expect(result.booked_conflicts).toEqual([
                { type: 'inquiry', id: 2, name: 'Alice Smith', status: 'Booked' },
                { type: 'project', id: 99, name: 'Confirmed Wedding', status: 'Confirmed' },
            ]);
            expect(result.soft_conflicts).toEqual([
                { type: 'inquiry', id: 3, name: 'Bob Jones', status: 'New' },
            ]);
        });
    });

    describe('checkCrewConflicts', () => {
        it('returns empty when no wedding date', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: null },
            });

            const result = await service.checkCrewConflicts(10, 1);
            expect(result).toEqual({ conflicts: [] });
        });

        it('includes on-set crew only once per crew member', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 5,
                    event_type: 'WEDDING_DAY',
                    title: 'Smith Wedding',
                    crew: {
                        contact: { first_name: 'Jane', last_name: 'Doe' },
                        job_role_assignments: [
                            { job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 5,
                    event_type: 'PROJECT_ASSIGNMENT',
                    title: 'Duplicate slot',
                    crew: {
                        contact: { first_name: 'Jane', last_name: 'Doe' },
                        job_role_assignments: [
                            { job_role: { name: 'videographer', display_name: 'Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 6,
                    event_type: 'WEDDING_DAY',
                    title: 'Editor only',
                    crew: {
                        contact: { first_name: 'Ed', last_name: 'Itor' },
                        job_role_assignments: [
                            { job_role: { name: 'editor', display_name: 'Editor' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(10, 1);

            expect(result.conflicts).toHaveLength(1);
            expect(result.conflicts[0]).toMatchObject({
                crew_id: 5,
                name: 'Jane Doe',
                role: 'Lead Videographer',
                event_type: 'WEDDING_DAY',
            });
        });
    });
});
