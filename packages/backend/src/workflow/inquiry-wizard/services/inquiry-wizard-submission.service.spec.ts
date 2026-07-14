import { NotFoundException } from '@nestjs/common';
import { InquiryWizardSubmissionService } from './inquiry-wizard-submission.service';

describe('InquiryWizardSubmissionService', () => {
  const prisma = {
    inquiries: { findFirst: jest.fn() },
    inquiry_wizard_submissions: { create: jest.fn() },
  };

  const templateService = {
    getTemplateById: jest.fn(),
  };

  let service: InquiryWizardSubmissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InquiryWizardSubmissionService(
      prisma as never,
      { autoCompleteByName: jest.fn() } as never,
      templateService as never,
      {} as never,
      {} as never,
    );
  });

  it('rejects DISCOVERY_CALL submissions that reference another brand inquiry', async () => {
    templateService.getTemplateById.mockResolvedValue({
      id: 10,
      stage: 'DISCOVERY_CALL',
    });
    prisma.inquiries.findFirst.mockResolvedValue(null);

    await expect(
      service.createSubmission(
        {
          template_id: 10,
          inquiry_id: 99,
          responses: {},
        },
        1,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.inquiry_wizard_submissions.create).not.toHaveBeenCalled();
  });

  it('creates DISCOVERY_CALL submissions when inquiry belongs to the brand', async () => {
    templateService.getTemplateById.mockResolvedValue({
      id: 10,
      stage: 'DISCOVERY_CALL',
    });
    prisma.inquiries.findFirst.mockResolvedValue({ id: 99 });
    prisma.inquiry_wizard_submissions.create.mockResolvedValue({ id: 1 });

    await service.createSubmission(
      {
        template_id: 10,
        inquiry_id: 99,
        responses: { notes: 'test' },
      },
      1,
    );

    expect(prisma.inquiry_wizard_submissions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          brand_id: 1,
          inquiry_id: 99,
          template_id: 10,
        }),
      }),
    );
  });
});
