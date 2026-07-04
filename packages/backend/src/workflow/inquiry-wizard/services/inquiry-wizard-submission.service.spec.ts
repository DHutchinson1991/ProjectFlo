import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardEstimateService } from './inquiry-wizard-estimate.service';
import { InquiryWizardLinkService } from './inquiry-wizard-link.service';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';
import { InquiryWizardTemplateService } from './inquiry-wizard-template.service';

describe('InquiryWizardSubmissionService', () => {
  let service: InquiryWizardSubmissionService;
  let prisma: {
    inquiries: { findFirst: jest.Mock };
    inquiry_wizard_submissions: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      inquiries: { findFirst: jest.fn() },
      inquiry_wizard_submissions: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        InquiryWizardSubmissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: InquiryTasksService, useValue: {} },
        { provide: InquiryWizardTemplateService, useValue: {} },
        { provide: InquiryWizardEstimateService, useValue: {} },
        { provide: InquiryWizardLinkService, useValue: {} },
      ],
    }).compile();

    service = module.get(InquiryWizardSubmissionService);
  });

  describe('updateSubmissionResponsesForPortal', () => {
    it('rejects when portal token does not match any inquiry', async () => {
      prisma.inquiries.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSubmissionResponsesForPortal('bad-token', 1, { notes: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when submission is not on the portal inquiry', async () => {
      prisma.inquiries.findFirst.mockResolvedValue({ id: 10 });
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSubmissionResponsesForPortal('valid-token', 99, { notes: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates responses when portal token and submission match', async () => {
      prisma.inquiries.findFirst.mockResolvedValue({ id: 10 });
      prisma.inquiry_wizard_submissions.findFirst.mockResolvedValue({
        id: 99,
        inquiry_id: 10,
        responses: { existing: 'value' },
      });
      prisma.inquiry_wizard_submissions.findUnique.mockResolvedValue({
        id: 99,
        inquiry_id: 10,
        responses: { existing: 'value' },
      });
      prisma.inquiry_wizard_submissions.update.mockResolvedValue({ id: 99 });

      await service.updateSubmissionResponsesForPortal('valid-token', 99, { notes: 'new' });

      expect(prisma.inquiry_wizard_submissions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 99 },
          data: { responses: { existing: 'value', notes: 'new' } },
        }),
      );
    });
  });
});
