import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InquiryWizardStage } from '@prisma/client';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';

describe('InquiryWizardSubmissionService', () => {
  let service: InquiryWizardSubmissionService;

  const prisma = {
    inquiry_wizard_submissions: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    inquiries: {
      update: jest.fn(),
    },
  };

  const inquiryTasksService = {
    autoCompleteByName: jest.fn(),
    syncReviewInquiryAutoSubtasks: jest.fn(),
  };

  const templateService = {
    getTemplateById: jest.fn(),
    findByShareToken: jest.fn(),
  };

  const estimateService = {
    autoCreateDraftEstimate: jest.fn(),
  };

  const linkService = {
    linkToExistingInquiry: jest.fn(),
    createNewInquiry: jest.fn(),
    createInquiryFromResponses: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryWizardSubmissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: InquiryTasksService, useValue: inquiryTasksService },
        { provide: InquiryWizardTemplateService, useValue: templateService },
        { provide: InquiryWizardEstimateService, useValue: estimateService },
        { provide: InquiryWizardLinkService, useValue: linkService },
      ],
    }).compile();

    service = module.get(InquiryWizardSubmissionService);
  });

  describe('createSubmission', () => {
    it('routes DISCOVERY_CALL submissions without inquiry linking or auto-estimate', async () => {
      templateService.getTemplateById.mockResolvedValue({
        id: 9,
        stage: InquiryWizardStage.DISCOVERY_CALL,
      });
      prisma.inquiry_wizard_submissions.create.mockResolvedValue({
        id: 100,
        inquiry_id: 55,
        template: { questions: [] },
      });

      const payload = {
        template_id: 9,
        inquiry_id: 55,
        responses: { venue_story: 'Historic barn' },
        call_notes: 'Great rapport',
        transcript: 'Hello there',
        sentiment: { positive: true },
        call_duration_seconds: 900,
      };

      const result = await service.createSubmission(payload, 1);

      expect(result.id).toBe(100);
      expect(linkService.linkToExistingInquiry).not.toHaveBeenCalled();
      expect(linkService.createNewInquiry).not.toHaveBeenCalled();
      expect(estimateService.autoCreateDraftEstimate).not.toHaveBeenCalled();
      expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            template_id: 9,
            inquiry_id: 55,
            call_notes: 'Great rapport',
            transcript: 'Hello there',
            sentiment: { positive: true },
            call_duration_seconds: 900,
          }),
        }),
      );
      expect(inquiryTasksService.autoCompleteByName).toHaveBeenCalledWith(55, 'Discovery Call');
    });

    it('creates INTAKE submissions with inquiry linking and auto-estimate', async () => {
      templateService.getTemplateById.mockResolvedValue({
        id: 2,
        stage: InquiryWizardStage.INTAKE,
      });
      linkService.linkToExistingInquiry.mockResolvedValue({ inquiryId: 77, contactId: 5 });
      prisma.inquiry_wizard_submissions.create.mockResolvedValue({
        id: 200,
        inquiry_id: 77,
        template: { questions: [] },
      });

      await service.createSubmission(
        {
          template_id: 2,
          inquiry_id: 77,
          responses: { wedding_date: '2026-09-12' },
        },
        1,
      );

      expect(linkService.linkToExistingInquiry).toHaveBeenCalled();
      expect(estimateService.autoCreateDraftEstimate).toHaveBeenCalledWith(77);
    });
  });

  describe('updateSubmissionResponses', () => {
    it('merges responses and syncs payment schedule template to the inquiry', async () => {
      prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
        id: 12,
        inquiry_id: 88,
        responses: { guest_count: '120-150', budget_range: '£3k – £5k' },
      });
      prisma.inquiry_wizard_submissions.update.mockResolvedValue({
        id: 12,
        responses: { guest_count: '150-200', budget_range: '£3k – £5k', payment_schedule_template_id: 4 },
      });

      await service.updateSubmissionResponses(12, {
        guest_count: '150-200',
        payment_schedule_template_id: 4,
      });

      expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith({
        where: { id: 12 },
        data: {
          responses: {
            guest_count: '150-200',
            budget_range: '£3k – £5k',
            payment_schedule_template_id: 4,
          },
        },
        include: expect.any(Object),
      });
      expect(prisma.inquiries.update).toHaveBeenCalledWith({
        where: { id: 88 },
        data: { preferred_payment_schedule_template_id: 4 },
      });
    });

    it('clears preferred payment schedule when response value is non-numeric', async () => {
      prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
        id: 12,
        inquiry_id: 88,
        responses: { payment_schedule_template_id: 4 },
      });
      prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 12 });

      await service.updateSubmissionResponses(12, {
        payment_schedule_template_id: 'none',
      });

      expect(prisma.inquiries.update).toHaveBeenCalledWith({
        where: { id: 88 },
        data: { preferred_payment_schedule_template_id: null },
      });
    });

    it('throws when submission does not exist', async () => {
      prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSubmissionResponses(999, { guest_count: '50' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('convertSubmission', () => {
    it('returns existing submission when inquiry is already linked', async () => {
      const linked = { id: 3, inquiry_id: 44, responses: {} };
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(linked);

      const result = await service.convertSubmission(3, 1);

      expect(result).toBe(linked);
      expect(linkService.createInquiryFromResponses).not.toHaveBeenCalled();
    });
  });
});
