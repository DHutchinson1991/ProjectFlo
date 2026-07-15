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

        it('separates booked inquiries from soft conflicts and includes projects', async () => {
            const weddingDate = new Date('2026-06-15T14:00:00Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 5, wedding_date: weddingDate },
            });
            prisma.inquiries.findMany.mockResolvedValue([
                {
                    id: 10,
                    status: 'Booked',
                    contact: { first_name: 'Booked', last_name: 'Couple' },
                },
                {
                    id: 11,
                    status: 'Active',
                    contact: { first_name: 'Soft', last_name: 'Lead' },
                },
            ]);
            prisma.projects.findMany.mockResolvedValue([
                { id: 20, project_name: 'Smith Wedding' },
            ]);

            const result = await service.checkDateConflicts(1, 1);

            expect(result.wedding_date).toEqual(weddingDate);
            expect(result.booked_conflicts).toEqual([
                { type: 'inquiry', id: 10, name: 'Booked Couple', status: 'Booked' },
                { type: 'project', id: 20, name: 'Smith Wedding', status: 'Confirmed' },
            ]);
            expect(result.soft_conflicts).toEqual([
                { type: 'inquiry', id: 11, name: 'Soft Lead', status: 'Active' },
            ]);
        });
    });

    describe('checkCrewConflicts', () => {
        it('returns empty when inquiry has no wedding date', async () => {
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 1, wedding_date: null },
            });

            const result = await service.checkCrewConflicts(1, 1);

            expect(result).toEqual({ conflicts: [] });
        });

        it('includes only on-set crew roles and deduplicates by crew id', async () => {
            const weddingDate = new Date('2026-07-01T10:00:00Z');
            prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
                inquiry: { id: 5, wedding_date: weddingDate },
            });
            prisma.calendar_events.findMany.mockResolvedValue([
                {
                    crew_id: 100,
                    event_type: 'WEDDING_DAY',
                    title: 'Jones Wedding',
                    crew: {
                        contact: { first_name: 'Alex', last_name: 'Cam' },
                        job_role_assignments: [
                            { job_role: { name: 'videographer', display_name: 'Lead Videographer' } },
                            { job_role: { name: 'producer', display_name: 'Producer' } },
                        ],
                    },
                },
                {
                    crew_id: 100,
                    event_type: 'WEDDING_DAY',
                    title: 'Duplicate event',
                    crew: {
                        contact: { first_name: 'Alex', last_name: 'Cam' },
                        job_role_assignments: [
                            { job_role: { name: 'videographer', display_name: 'Lead Videographer' } },
                        ],
                    },
                },
                {
                    crew_id: 101,
                    event_type: 'PROJECT_ASSIGNMENT',
                    title: 'Office day',
                    crew: {
                        contact: { first_name: 'Sam', last_name: 'Admin' },
                        job_role_assignments: [
                            { job_role: { name: 'office_manager', display_name: 'Office Manager' } },
                        ],
                    },
                },
            ]);

            const result = await service.checkCrewConflicts(1, 1);

            expect(result.conflicts).toEqual([
                {
                    crew_id: 100,
                    name: 'Alex Cam',
                    role: 'Lead Videographer',
                    event_type: 'WEDDING_DAY',
                    event_title: 'Jones Wedding',
                },
            ]);
        });
    });
});
