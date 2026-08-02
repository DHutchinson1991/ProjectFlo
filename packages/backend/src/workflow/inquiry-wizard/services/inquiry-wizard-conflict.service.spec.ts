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

      const result = await service.checkDateConflicts(5, 99);

      expect(result).toEqual({
        wedding_date: null,
        booked_conflicts: [],
        soft_conflicts: [],
      });
      expect(prisma.inquiries.findMany).not.toHaveBeenCalled();
    });

    it('separates booked inquiries from soft conflicts and includes projects', async () => {
      const weddingDate = new Date('2026-06-14T15:00:00.000Z');
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
        inquiry: { id: 10, wedding_date: weddingDate },
      });
      prisma.inquiries.findMany.mockResolvedValue([
        {
          id: 11,
          status: 'Booked',
          contact: { first_name: 'Amy', last_name: 'Stone' },
        },
        {
          id: 12,
          status: 'New',
          contact: { first_name: 'Ben', last_name: 'Cole' },
        },
      ]);
      prisma.projects.findMany.mockResolvedValue([
        { id: 30, project_name: 'Miller Wedding' },
      ]);

      const result = await service.checkDateConflicts(5, 99);

      expect(result.wedding_date).toEqual(weddingDate);
      expect(result.booked_conflicts).toEqual([
        { type: 'inquiry', id: 11, name: 'Amy Stone', status: 'Booked' },
        { type: 'project', id: 30, name: 'Miller Wedding', status: 'Confirmed' },
      ]);
      expect(result.soft_conflicts).toEqual([
        { type: 'inquiry', id: 12, name: 'Ben Cole', status: 'New' },
      ]);
    });
  });

  describe('checkCrewConflicts', () => {
    it('returns only on-set crew roles for overlapping calendar events', async () => {
      const weddingDate = new Date('2026-06-14T12:00:00.000Z');
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
        inquiry: { id: 10, wedding_date: weddingDate },
      });
      prisma.calendar_events.findMany.mockResolvedValue([
        {
          crew_id: 1,
          event_type: 'WEDDING_DAY',
          title: 'Smith Wedding',
          crew: {
            contact: { first_name: 'Chris', last_name: 'Vale' },
            job_role_assignments: [
              {
                job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' },
              },
            ],
          },
        },
        {
          crew_id: 2,
          event_type: 'PROJECT_ASSIGNMENT',
          title: 'Office admin',
          crew: {
            contact: { first_name: 'Dana', last_name: 'Ops' },
            job_role_assignments: [
              {
                job_role: { name: 'coordinator', display_name: 'Coordinator' },
              },
            ],
          },
        },
        {
          crew_id: 1,
          event_type: 'PROJECT_ASSIGNMENT',
          title: 'Duplicate crew event',
          crew: {
            contact: { first_name: 'Chris', last_name: 'Vale' },
            job_role_assignments: [
              {
                job_role: { name: 'lead_videographer', display_name: 'Lead Videographer' },
              },
            ],
          },
        },
      ]);

      const result = await service.checkCrewConflicts(5, 99);

      expect(result.conflicts).toEqual([
        {
          crew_id: 1,
          name: 'Chris Vale',
          role: 'Lead Videographer',
          event_type: 'WEDDING_DAY',
          event_title: 'Smith Wedding',
        },
      ]);
    });
  });
});
