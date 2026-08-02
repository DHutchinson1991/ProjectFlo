import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

const buildPrisma = () => ({
  inquiry_wizard_submissions: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  inquiries: {
    update: jest.fn(),
  },
});

describe('InquiryWizardSubmissionService', () => {
  let service: InquiryWizardSubmissionService;
  let prisma: ReturnType<typeof buildPrisma>;
  let templateService: { getTemplateById: jest.Mock; findByShareToken: jest.Mock };
  let estimateService: { autoCreateDraftEstimate: jest.Mock };
  let linkService: {
    linkToExistingInquiry: jest.Mock;
    createNewInquiry: jest.Mock;
    createInquiryFromResponses: jest.Mock;
  };
  let inquiryTasksService: { autoCompleteByName: jest.Mock };

  beforeEach(async () => {
    prisma = buildPrisma();
    templateService = {
      getTemplateById: jest.fn(),
      findByShareToken: jest.fn(),
    };
    estimateService = { autoCreateDraftEstimate: jest.fn() };
    linkService = {
      linkToExistingInquiry: jest.fn(),
      createNewInquiry: jest.fn(),
      createInquiryFromResponses: jest.fn(),
    };
    inquiryTasksService = { autoCompleteByName: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryWizardSubmissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: InquiryWizardTemplateService, useValue: templateService },
        { provide: InquiryWizardEstimateService, useValue: estimateService },
        { provide: InquiryWizardLinkService, useValue: linkService },
        { provide: InquiryTasksService, useValue: inquiryTasksService },
      ],
    }).compile();

    service = module.get(InquiryWizardSubmissionService);
  });

  describe('createSubmission', () => {
    it('creates discovery call submissions without linking inquiries or auto-estimates', async () => {
      templateService.getTemplateById.mockResolvedValue({
        id: 1,
        stage: InquiryWizardStage.DISCOVERY_CALL,
      });
      const created = { id: 50, inquiry_id: 10 };
      prisma.inquiry_wizard_submissions.create.mockResolvedValue(created);

      const result = await service.createSubmission(
        {
          template_id: 1,
          inquiry_id: 10,
          responses: { notes: 'Great call' },
          call_notes: 'Follow up on venue',
          transcript: 'Hello...',
        },
        99,
      );

      expect(result).toBe(created);
      expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
      expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
      expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            template_id: 1,
            inquiry_id: 10,
            call_notes: 'Follow up on venue',
            transcript: 'Hello...',
          }),
        }),
      );
      expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(10, 'Discovery Call');
    });

    it('links an existing inquiry and auto-creates a draft estimate for intake submissions', async () => {
      templateService.getTemplateById.mockResolvedValue({
        id: 2,
        stage: InquiryWizardStage.INTAKE,
      });
      linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 20, contactId: 30 });
      prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 51, inquiry_id: 20 });

      await service.createSubmission(
        {
          template_id: 2,
          inquiry_id: 20,
          responses: { wedding_date: '2026-09-01' },
        },
        99,
      );

      expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
      expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(20);
      expect(inquiryTasksService.autoCompleteByName).not.toHaveBeenCalled();
    });
  });

  describe('updateSubmissionResponses', () => {
    it('merges new responses onto existing submission responses', async () => {
      prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
        id: 7,
        inquiry_id: null,
        responses: { venue_name: 'Old Hall' },
      });
      prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 7 });

      await service.updateSubmissionResponses(7, { guest_count: '120' });

      expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { responses: { venue_name: 'Old Hall', guest_count: '120' } },
        }),
      );
    });

    it('syncs payment schedule template id to the linked inquiry', async () => {
      prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
        id: 7,
        inquiry_id: 15,
        responses: {},
      });
      prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 7 });
      prisma.inquiries.update.mockResolvedValue({ id: 15 });

      await service.updateSubmissionResponses(7, { payment_schedule_template_id: 42 });

      expect(prisma.inquiries.update).toHaveBeenCalledWith({
        where: { id: 15 },
        data: { preferred_payment_schedule_template_id: 42 },
      });
    });
  });

  describe('convertSubmission', () => {
    it('returns the submission unchanged when it already has an inquiry', async () => {
      const submission = { id: 3, inquiry_id: 8, responses: {} };
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
        ...submission,
        template: { questions: [] },
        inquiry: null,
        contact: null,
      });

      const result = await service.convertSubmission(3, 99);

      expect(result).toMatchObject({ inquiry_id: 8 });
      expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
    });

    it('creates an inquiry from responses when submission is unlinked', async () => {
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
        id: 4,
        inquiry_id: null,
        responses: { contact_email: 'couple@example.com' },
        template: { questions: [] },
        inquiry: null,
        contact: null,
      });
      linkService.createInquiryFromResponses.mockResolvedValue(88);
      prisma.inquiry_wizard_submissions.update.mockResolvedValue({
        id: 4,
        inquiry_id: 88,
        status: 'converted',
      });

      const result = await service.convertSubmission(4, 99);

      expect(linkService.createInquiryFromResponses).toHaveBeenCalledWith(
        { contact_email: 'couple@example.com' },
        99,
      );
      expect(result).toMatchObject({ inquiry_id: 88, status: 'converted' });
    });
  });

  describe('reviewSubmission', () => {
    it('marks submission reviewed and auto-completes the review task', async () => {
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
        id: 9,
        inquiry_id: 22,
        template: { questions: [] },
        inquiry: null,
        contact: null,
      });
      prisma.inquiry_wizard_submissions.update.mockResolvedValue({
        id: 9,
        review_notes: 'Looks good',
      });

      await service.reviewSubmission(9, 99, {
        review_notes: 'Looks good',
        review_checklist_state: { package_confirmed: true },
      });

      expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            review_notes: 'Looks good',
            review_checklist_state: { package_confirmed: true },
          }),
        }),
      );
      expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(22, 'Review Inquiry');
    });
  });

  describe('getSubmissionById', () => {
    it('throws when submission is missing', async () => {
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);

      await expect(service.getSubmissionById(404, 99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
